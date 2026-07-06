#!/usr/bin/env node
// PSI(PageSpeed Insights) 웹 UI 대신 로컬 Lighthouse CLI로 같은 Lab 지표를 자동 측정한다.
// 사용법: node docs/성능/scripts/psi-check.mjs <URL> [runs=2]
import { execFileSync } from "node:child_process";
import { readFileSync, mkdtempSync, rmSync, appendFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// 여러 URL을 배치로 돌릴 때 stdout(파이프) 버퍼링/유실 문제를 피하려면
// PSI_LOG_FILE 환경변수에 파일 경로를 지정한다 — 동기 appendFileSync라 잘림이 없다.
const LOG_FILE = process.env.PSI_LOG_FILE;
function out(line) {
  console.log(line);
  if (LOG_FILE) appendFileSync(LOG_FILE, line + "\n");
}

const [, , url, runsArg] = process.argv;
if (!url) {
  console.error("사용법: node psi-check.mjs <URL> [runs=2]");
  process.exit(1);
}
{
  const parsed = new URL(url); // 형식이 아니면 여기서 바로 에러
  if (!["http:", "https:"].includes(parsed.protocol)) {
    console.error("http/https URL만 지원합니다.");
    process.exit(1);
  }
  if (/["'`$&|;<>^]/.test(url)) {
    console.error("URL에 셸 특수문자가 포함되어 있어 실행을 거부합니다.");
    process.exit(1);
  }
}
const runs = Number(runsArg || 2);

const OPPORTUNITY_MIN_SAVING_MS = 10;
const OPPORTUNITY_MIN_SAVING_BYTES = 1024;
const DIAGNOSTIC_IDS = [
  "mainthread-work-breakdown",
  "bootup-time",
  "dom-size",
  "legacy-javascript",
  "uses-long-cache-ttl",
  "font-display",
  "third-party-summary",
  "layout-shift-elements",
];

const NPX_BIN = process.platform === "win32" ? "npx.cmd" : "npx";

function runLighthouse(formFactor) {
  const dir = mkdtempSync(join(tmpdir(), "lh-"));
  const outPath = join(dir, "report.json");
  const presetArgs = formFactor === "desktop" ? ["--preset=desktop"] : [];
  try {
    execFileSync(
      NPX_BIN,
      [
        "--yes",
        "lighthouse",
        url,
        "--output=json",
        `--output-path=${outPath}`,
        "--chrome-flags=--headless",
        "--quiet",
        ...presetArgs,
      ],
      { stdio: ["ignore", "ignore", "ignore"], shell: true }
    );
  } catch {
    // chrome-launcher가 임시 프로필 폴더 삭제 중 EPERM으로 비정상 종료 코드를 낼 수 있으나
    // 리포트 JSON 자체는 이미 기록된 뒤라 무시해도 된다.
  }
  const json = JSON.parse(readFileSync(outPath, "utf8"));
  rmSync(dir, { recursive: true, force: true });
  return json;
}

const ms = (v) => (v == null ? null : Math.round(v));
const sec = (v) => (v == null ? null : Math.round(v) / 1000);

function extract(json) {
  const cat = (k) => Math.round((json.categories[k]?.score ?? 0) * 100);
  const a = (id) => json.audits[id];

  const opportunities = Object.values(json.audits)
    .filter((x) => x.details?.type === "opportunity")
    .map((x) => ({
      title: x.title,
      savingsMs: x.details.overallSavingsMs,
      savingsKiB: x.details.overallSavingsBytes
        ? Math.round(x.details.overallSavingsBytes / 1024)
        : undefined,
    }))
    .filter(
      (x) =>
        (x.savingsMs ?? 0) >= OPPORTUNITY_MIN_SAVING_MS ||
        (x.savingsKiB ?? 0) * 1024 >= OPPORTUNITY_MIN_SAVING_BYTES
    )
    .sort((x, y) => (y.savingsMs ?? 0) - (x.savingsMs ?? 0));

  const diagnostics = DIAGNOSTIC_IDS.map((id) => a(id))
    .filter((x) => x && x.score !== 1 && x.displayValue)
    .map((x) => ({ title: x.title, value: x.displayValue }));

  return {
    performance: cat("performance"),
    accessibility: cat("accessibility"),
    bestPractices: cat("best-practices"),
    seo: cat("seo"),
    agentic: json.categories["agentic-browsing"]
      ? Math.round(json.categories["agentic-browsing"].score * 100)
      : null,
    fcp: sec(a("first-contentful-paint")?.numericValue),
    lcp: sec(a("largest-contentful-paint")?.numericValue),
    tbt: ms(a("total-blocking-time")?.numericValue),
    cls:
      a("cumulative-layout-shift")?.numericValue != null
        ? Math.round(a("cumulative-layout-shift").numericValue * 1000) / 1000
        : null,
    si: sec(a("speed-index")?.numericValue),
    opportunities,
    diagnostics,
  };
}

function median(nums) {
  const s = [...nums].sort((x, y) => x - y);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : Math.round(((s[mid - 1] + s[mid]) / 2) * 100) / 100;
}

async function main() {
  out(`대상: ${url}\n`);
  for (const formFactor of ["mobile", "desktop"]) {
    const label = formFactor === "mobile" ? "📱 모바일" : "🖥️ 데스크탑";
    out(`=== ${label} (${runs}회) ===`);
    const results = [];
    for (let i = 0; i < runs; i++) {
      process.stderr.write(`  [${formFactor}] 실행 ${i + 1}/${runs}...\n`);
      results.push(extract(runLighthouse(formFactor)));
    }
    results.forEach((r, i) => {
      out(
        `  측정${i + 1}: Perf ${r.performance} / A11y ${r.accessibility} / BP ${r.bestPractices} / SEO ${r.seo}` +
          (r.agentic != null ? ` / Agentic ${r.agentic}` : "") +
          ` | FCP ${r.fcp}s LCP ${r.lcp}s TBT ${r.tbt}ms CLS ${r.cls} SI ${r.si}s`
      );
    });
    if (results.length > 1) {
      out(
        `  대표값(중간값): Perf ${median(results.map((r) => r.performance))}` +
          ` | LCP ${median(results.map((r) => r.lcp))}s` +
          ` TBT ${median(results.map((r) => r.tbt))}ms` +
          ` CLS ${median(results.map((r) => r.cls))}` +
          ` SI ${median(results.map((r) => r.si))}s`
      );
    }
    const last = results[results.length - 1];
    if (last.opportunities.length) {
      out(
        "  Insights: " +
          last.opportunities
            .map(
              (o) =>
                `${o.title}${o.savingsMs ? ` ${o.savingsMs}ms` : ""}${
                  o.savingsKiB ? ` ${o.savingsKiB}KiB` : ""
                }`
            )
            .join(" · ")
      );
    }
    if (last.diagnostics.length) {
      out(
        "  Diagnostics: " + last.diagnostics.map((d) => `${d.title} ${d.value}`).join(" · ")
      );
    }
    out("");
  }
}

main();
