import { MonitoringTrendChart } from "../MonitoringTrendChart";
import type { MonitoringStats } from "@/services/admin/adminMonitoring";

const CAT_COLORS: Record<string, string> = {
  "중고거래": "#ea580c",
  "커뮤니티": "#7c3aed",
  "구인구직": "#2563eb",
  "부동산": "#16a34a",
};

interface Props {
  stats: Pick<MonitoringStats, "dailySignups" | "monthlySignups" | "yearlySignups" | "postTypes" | "regions">;
}

export function StatsTab({ stats }: Props) {
  const maxPostType = Math.max(...stats.postTypes.map((p) => p.count), 1);
  const maxRegion = Math.max(...stats.regions.map((r) => r.count), 1);

  return (
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
  );
}
