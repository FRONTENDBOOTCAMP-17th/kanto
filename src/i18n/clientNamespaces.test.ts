// @vitest-environment node
import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import {
  GLOBAL_CLIENT_NAMESPACES,
  SEGMENT_CLIENT_NAMESPACES,
} from "./clientNamespaces";

// import 그래프를 따라가며 "use client" 경계 아래에서 쓰이는 useTranslations 네임스페이스를 모아,
// clientNamespaces.ts 목록에 빠진 것이 없는지 검사한다.

const SRC = path.resolve(__dirname, "..");
const EXTS = [".tsx", ".ts", ".jsx", ".js"];
const IMPORT_RE =
  /(?:import|export)\s+(type\s+)?(?:[\w*{}\s,]+?\s+from\s+)?["']([^"']+)["']|import\(\s*["']([^"']+)["']\s*\)/g;
const TRANSLATIONS_RE = /useTranslations\(\s*["']([^"']+)["']\s*\)/g;
const USE_CLIENT_RE = /^\s*(?:\/\*[\s\S]*?\*\/\s*|\/\/[^\n]*\n\s*)*["']use client["']/;

type ModuleInfo = { isClient: boolean; deps: string[]; namespaces: Set<string> };
const cache = new Map<string, ModuleInfo>();

function resolve(spec: string, from: string): string | null {
  let base: string;
  if (spec.startsWith("@/")) base = path.join(SRC, spec.slice(2));
  else if (spec.startsWith(".")) base = path.resolve(path.dirname(from), spec);
  else return null;
  if (fs.existsSync(base) && fs.statSync(base).isFile()) return base;
  for (const ext of EXTS) if (fs.existsSync(base + ext)) return base + ext;
  for (const ext of EXTS) {
    const index = path.join(base, `index${ext}`);
    if (fs.existsSync(index)) return index;
  }
  return null;
}

function info(file: string): ModuleInfo {
  const hit = cache.get(file);
  if (hit) return hit;
  const src = fs.readFileSync(file, "utf8");
  const deps: string[] = [];
  for (const m of src.matchAll(IMPORT_RE)) {
    if (m[1]) continue; // import type
    const r = resolve(m[2] ?? m[3], file);
    if (r && EXTS.some((e) => r.endsWith(e))) deps.push(r);
  }
  const namespaces = new Set([...src.matchAll(TRANSLATIONS_RE)].map((m) => m[1].split(".")[0]));
  const result = { isClient: USE_CLIENT_RE.test(src), deps, namespaces };
  cache.set(file, result);
  return result;
}

function clientNamespaces(entries: string[]): Set<string> {
  const seen = new Set<string>();
  const out = new Set<string>();
  const stack: [string, boolean][] = entries.map((f) => [f, false]);
  while (stack.length) {
    const [file, parentClient] = stack.pop()!;
    const mod = info(file);
    const inClient = parentClient || mod.isClient;
    const key = `${file}:${inClient}`;
    if (seen.has(key)) continue;
    seen.add(key);
    if (inClient) mod.namespaces.forEach((ns) => out.add(ns));
    mod.deps.forEach((d) => stack.push([d, inClient]));
  }
  return out;
}

function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return walk(p);
    return EXTS.some((x) => e.name.endsWith(x)) && !e.name.includes(".test.") ? [p] : [];
  });
}

function findDir(dir: string, name: string): string | null {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    const p = path.join(dir, e.name);
    if (e.name === name) return p;
    const found = findDir(p, name);
    if (found) return found;
  }
  return null;
}

const APP = path.join(SRC, "app");
const USER_GROUP = findDir(APP, "(user)")!;
const ADMIN_GROUP = findDir(APP, "(admin)")!;
const ROOT_LAYOUT_DIR = path.dirname(USER_GROUP);
const global = new Set<string>(GLOBAL_CLIENT_NAMESPACES);

describe("클라이언트 메시지 네임스페이스", () => {
  it("전역 레이아웃이 쓰는 네임스페이스가 GLOBAL_CLIENT_NAMESPACES에 모두 있다", () => {
    const used = clientNamespaces([path.join(ROOT_LAYOUT_DIR, "layout.tsx")]);
    expect([...used].filter((ns) => !global.has(ns))).toEqual([]);
  });

  const segments = [USER_GROUP, ADMIN_GROUP].flatMap((group) =>
    fs
      .readdirSync(group, { withFileTypes: true })
      .filter((e) => e.isDirectory() && !e.name.startsWith("_"))
      .map((e) => path.join(group, e.name)),
  );

  it.each(segments.map((s) => [path.basename(s), s]))(
    "%s 세그먼트의 클라이언트 네임스페이스가 전역 또는 세그먼트 목록에 있다",
    (name, dir) => {
      const scoped = new Set<string>(
        (SEGMENT_CLIENT_NAMESPACES as Record<string, readonly string[]>)[name] ?? [],
      );
      const used = clientNamespaces(walk(dir));
      expect([...used].filter((ns) => !global.has(ns) && !scoped.has(ns))).toEqual([]);

      if (scoped.size > 0) {
        const wrapped = ["layout.tsx", "page.tsx"].some((f) => {
          const p = path.join(dir, f);
          return fs.existsSync(p) && fs.readFileSync(p, "utf8").includes(`segment="${name}"`);
        });
        expect(wrapped, `${name}/layout.tsx 또는 page.tsx에서 ScopedIntlProvider로 감싸야 한다`).toBe(true);
      }
    },
  );
});
