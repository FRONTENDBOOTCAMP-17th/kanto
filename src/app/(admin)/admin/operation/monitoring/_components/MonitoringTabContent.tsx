"use client";

import { useState } from "react";
import { ExternalLink, XCircle, AlertCircle, Info, BarChart2, AlertTriangle, Zap } from "lucide-react";
import { MonitoringTrendChart } from "./MonitoringTrendChart";
import type { MonitoringStats, SentryResult, SentryPerformance } from "@/services/admin/adminMonitoring";

type Tab = "stats" | "perf" | "errors";

const LEVEL_CONFIG = {
  error: { icon: XCircle, badge: "bg-red-50 text-red-600 border-red-100", label: "오류" },
  warning: { icon: AlertCircle, badge: "bg-amber-50 text-amber-600 border-amber-100", label: "경고" },
  info: { icon: Info, badge: "bg-blue-50 text-blue-600 border-blue-100", label: "정보" },
};

const CAT_COLORS: Record<string, string> = {
  "중고거래": "#ea580c",
  "Kanto Go!": "#7c3aed",
  "구인구직": "#2563eb",
  "방 렌탈": "#16a34a",
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "방금 전";
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  return `${Math.floor(hours / 24)}일 전`;
}

function vitalStatus(key: "lcp" | "fcp" | "cls" | "ttfb", value: number): "good" | "needs" | "poor" {
  const thresholds: Record<string, [number, number]> = {
    lcp: [2500, 4000],
    fcp: [1800, 3000],
    cls: [0.1, 0.25],
    ttfb: [800, 1800],
  };
  const [good, poor] = thresholds[key];
  if (value <= good) return "good";
  if (value < poor) return "needs";
  return "poor";
}

const VITAL_STATUS_STYLE = {
  good: { text: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100", label: "좋음" },
  needs: { text: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100", label: "개선 필요" },
  poor: { text: "text-red-600", bg: "bg-red-50", border: "border-red-100", label: "나쁨" },
};

interface Props {
  stats: Pick<MonitoringStats, "dailySignups" | "monthlySignups" | "yearlySignups" | "postTypes" | "regions">;
  sentry: SentryResult;
  performance: SentryPerformance;
}

export function MonitoringTabContent({ stats, sentry, performance }: Props) {
  const [tab, setTab] = useState<Tab>("stats");

  const maxPostType = Math.max(...stats.postTypes.map((p) => p.count), 1);
  const maxRegion = Math.max(...stats.regions.map((r) => r.count), 1);
  const errorCount = sentry.issues.filter((i) => i.level === "error").length;

  const tabBtn = (t: Tab, icon: React.ReactNode, label: React.ReactNode) => (
    <button
      onClick={() => setTab(t)}
      className={[
        "flex items-center gap-2 rounded-xl px-5 py-2.5 text-[14px] font-semibold transition-colors",
        tab === t
          ? "bg-teal-500 text-white shadow-sm"
          : "border border-[#ebeef0] bg-white text-slate-500 hover:bg-slate-50",
      ].join(" ")}
    >
      {icon}
      {label}
    </button>
  );

  const vitals = [
    { key: "lcp" as const, label: "LCP", desc: "최대 콘텐츠 렌더링", unit: "ms", value: performance.webVitals.lcp },
    { key: "fcp" as const, label: "FCP", desc: "첫 콘텐츠 표시", unit: "ms", value: performance.webVitals.fcp },
    { key: "cls" as const, label: "CLS", desc: "레이아웃 흔들림", unit: "", value: performance.webVitals.cls },
    { key: "ttfb" as const, label: "TTFB", desc: "첫 바이트 응답", unit: "ms", value: performance.webVitals.ttfb },
  ];

  return (
    <>
      {/* 탭 버튼 */}
      <div className="mb-6 flex gap-3">
        {tabBtn("stats", <BarChart2 className="h-4 w-4" strokeWidth={2} />, "통계")}
        {tabBtn("perf", <Zap className="h-4 w-4" strokeWidth={2} />, "성능")}
        {tabBtn(
          "errors",
          <AlertTriangle className="h-4 w-4" strokeWidth={2} />,
          <>
            오류 로그
            {errorCount > 0 && (
              <span className={["rounded-full px-1.5 py-0.5 text-[11px] font-bold", tab === "errors" ? "bg-white text-teal-600" : "bg-red-500 text-white"].join(" ")}>
                {errorCount}
              </span>
            )}
          </>,
        )}
      </div>

      {/* 통계 탭 */}
      {tab === "stats" && (
        <>
          <MonitoringTrendChart
            dailySignups={stats.dailySignups}
            monthlySignups={stats.monthlySignups}
            yearlySignups={stats.yearlySignups}
          />

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-[#ebeef0] bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
              <h2 className="mb-4 text-[16px] font-bold text-slate-900">게시물 유형 분포</h2>
              {stats.postTypes.length === 0 ? (
                <p className="text-[13px] text-slate-400">데이터 없음</p>
              ) : (
                <div className="space-y-4">
                  {stats.postTypes.map((item) => (
                    <div key={item.name}>
                      <div className="mb-1.5 flex items-center justify-between text-[13px]">
                        <span className="font-medium text-slate-700">{item.name}</span>
                        <span className="font-bold text-slate-900">{item.count.toLocaleString()}건 · {item.pct}</span>
                      </div>
                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${(item.count / maxPostType) * 100}%`, backgroundColor: CAT_COLORS[item.name] ?? "#64748b" }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-[#ebeef0] bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-[16px] font-bold text-slate-900">지역별 게시물</h2>
                <span className="text-[12px] text-slate-400">최근 30일</span>
              </div>
              {stats.regions.length === 0 ? (
                <p className="text-[13px] text-slate-400">데이터 없음</p>
              ) : (
                <div className="space-y-3">
                  {stats.regions.map((r) => (
                    <div key={r.name}>
                      <div className="mb-1 flex items-center justify-between text-[13px]">
                        <span className="font-medium text-slate-700">{r.name}</span>
                        <span className="font-bold text-slate-900">{r.count.toLocaleString()}건</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-teal-400 transition-all duration-700"
                          style={{ width: `${(r.count / maxRegion) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* 성능 탭 */}
      {tab === "perf" && (
        <div className="space-y-6">
          {/* Core Web Vitals */}
          <div className="rounded-2xl border border-[#ebeef0] bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-[16px] font-bold text-slate-900">Core Web Vitals</h2>
                <p className="mt-0.5 text-[12.5px] text-slate-400">페이지 로드 기준 P75 · 최근 24시간</p>
              </div>
              <a
                href="https://sentry.io"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-[12.5px] font-semibold text-white hover:bg-slate-700"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Sentry
              </a>
            </div>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {vitals.map(({ key, label, desc, unit, value }) => {
                if (value === null) {
                  return (
                    <div key={key} className="rounded-xl border border-[#ebeef0] p-4">
                      <p className="text-[12px] font-semibold text-slate-400">{label}</p>
                      <p className="mt-1 text-[11px] text-slate-300">{desc}</p>
                      <p className="mt-3 text-[20px] font-bold text-slate-300">—</p>
                      <p className="mt-1 text-[11px] text-slate-300">데이터 없음</p>
                    </div>
                  );
                }
                const status = vitalStatus(key, value);
                const style = VITAL_STATUS_STYLE[status];
                return (
                  <div key={key} className={`rounded-xl border p-4 ${style.bg} ${style.border}`}>
                    <p className={`text-[12px] font-semibold ${style.text}`}>{label}</p>
                    <p className="mt-1 text-[11px] text-slate-500">{desc}</p>
                    <p className={`mt-3 text-[22px] font-extrabold tracking-tight ${style.text}`}>
                      {value}{unit}
                    </p>
                    <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${style.bg} ${style.text}`}>
                      {style.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 트랜잭션 Top 10 */}
          <div className="rounded-2xl border border-[#ebeef0] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
            <div className="border-b border-[#ebeef0] px-6 py-4">
              <h2 className="text-[16px] font-bold text-slate-900">트랜잭션 상위 10개</h2>
              <p className="mt-0.5 text-[12.5px] text-slate-400">요청 수 기준 · 최근 24시간</p>
            </div>
            {performance.transactions.length === 0 ? (
              <div className="px-6 py-10 text-center text-[13px] text-slate-400">트랜잭션 데이터가 없습니다.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="border-b border-[#ebeef0] text-left text-[12px] text-slate-400">
                      <th className="px-6 py-3 font-semibold">트랜잭션</th>
                      <th className="px-4 py-3 text-right font-semibold">요청 수</th>
                      <th className="px-4 py-3 text-right font-semibold">평균 응답</th>
                      <th className="px-4 py-3 text-right font-semibold">P95</th>
                      <th className="px-4 py-3 text-right font-semibold">실패율</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#ebeef0]">
                    {performance.transactions.map((tx) => (
                      <tr key={tx.transaction} className="hover:bg-slate-50">
                        <td className="max-w-[240px] truncate px-6 py-3 font-medium text-slate-700">{tx.transaction}</td>
                        <td className="px-4 py-3 text-right text-slate-700">{tx.count.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-slate-700">{tx.avgDuration}ms</td>
                        <td className={`px-4 py-3 text-right font-semibold ${tx.p95Duration > 3000 ? "text-red-500" : tx.p95Duration > 1500 ? "text-amber-500" : "text-slate-700"}`}>
                          {tx.p95Duration}ms
                        </td>
                        <td className={`px-4 py-3 text-right font-semibold ${tx.failureRate > 0.05 ? "text-red-500" : tx.failureRate > 0 ? "text-amber-500" : "text-slate-400"}`}>
                          {tx.failureRate === 0 ? "—" : `${(tx.failureRate * 100).toFixed(1)}%`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 오류 로그 탭 */}
      {tab === "errors" && (
        <div className="rounded-2xl border border-[#ebeef0] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
          <div className="flex items-center justify-between border-b border-[#ebeef0] px-6 py-4">
            <div>
              <h2 className="text-[16px] font-bold text-slate-900">오류 로그</h2>
              <p className="mt-0.5 text-[12.5px] text-slate-400">
                {sentry.configured ? "Sentry 연동 · 미해결 이슈 최근 10건" : "Sentry 미연동 · 환경변수 설정 필요"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {!sentry.configured && (
                <span className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-[12px] font-medium text-amber-600">
                  설정 필요
                </span>
              )}
              <a
                href="https://sentry.io"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-[12.5px] font-semibold text-white hover:bg-slate-700"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Sentry 대시보드
              </a>
            </div>
          </div>

          {!sentry.configured ? (
            <div className="px-6 py-10 text-center">
              <p className="text-[13.5px] font-semibold text-slate-700">Sentry 연동이 필요합니다</p>
              <p className="mt-1.5 text-[12.5px] text-slate-400">
                .env.local에 NEXT_PUBLIC_SENTRY_DSN, SENTRY_AUTH_TOKEN, SENTRY_ORG, SENTRY_PROJECT를 설정하세요.
              </p>
            </div>
          ) : sentry.issues.length === 0 ? (
            <div className="px-6 py-10 text-center text-[13px] text-slate-400">미해결 이슈가 없습니다.</div>
          ) : (
            <div className="divide-y divide-[#ebeef0]">
              {sentry.issues.map((err) => {
                const level = (err.level in LEVEL_CONFIG ? err.level : "info") as keyof typeof LEVEL_CONFIG;
                const cfg = LEVEL_CONFIG[level];
                const Icon = cfg.icon;
                const iconColor = level === "error" ? "text-red-500" : level === "warning" ? "text-amber-400" : "text-blue-400";
                return (
                  <a
                    key={err.id}
                    href={err.permalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-4 px-6 py-4 transition-colors hover:bg-slate-50"
                  >
                    <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${iconColor}`} strokeWidth={2} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-[13.5px] font-semibold text-slate-800">{err.title}</span>
                        {err.isNew && (
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-bold text-red-500">NEW</span>
                        )}
                      </div>
                      <p className="mt-0.5 truncate text-[12px] text-slate-400">{err.culprit}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${cfg.badge}`}>
                        {cfg.label}
                      </span>
                      <div className="mt-1.5 text-[12px] text-slate-400">
                        <span className="font-semibold text-slate-700">{Number(err.count).toLocaleString()}회</span>
                        &nbsp;·&nbsp;{relativeTime(err.lastSeen)}
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          )}

          <div className="border-t border-[#ebeef0] px-6 py-3 text-center">
            <a
              href="https://sentry.io"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-400 hover:text-teal-500"
            >
              Sentry에서 전체 로그 보기
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      )}
    </>
  );
}
