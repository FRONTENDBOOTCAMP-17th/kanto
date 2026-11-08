import { ExternalLink } from "lucide-react";
import type { SentryPerformance } from "@/services/admin/adminMonitoring";

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
  performance: SentryPerformance;
}

export function PerfTab({ performance }: Props) {
  const vitals = [
    { key: "lcp" as const, label: "LCP", desc: "최대 콘텐츠 렌더링", unit: "ms", value: performance.webVitals.lcp },
    { key: "fcp" as const, label: "FCP", desc: "첫 콘텐츠 표시", unit: "ms", value: performance.webVitals.fcp },
    { key: "cls" as const, label: "CLS", desc: "레이아웃 흔들림", unit: "", value: performance.webVitals.cls },
    { key: "ttfb" as const, label: "TTFB", desc: "첫 바이트 응답", unit: "ms", value: performance.webVitals.ttfb },
  ];

  return (
    <div className="space-y-6">
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
  );
}
