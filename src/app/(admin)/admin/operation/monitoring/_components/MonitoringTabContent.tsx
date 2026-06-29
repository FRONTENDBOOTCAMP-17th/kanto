"use client";

import { useState } from "react";
import { BarChart2, AlertTriangle, Zap } from "lucide-react";
import { StatsTab } from "./stats/StatsTab";
import { PerfTab } from "./perf/PerfTab";
import { ErrorsTab } from "./errors/ErrorsTab";
import type { MonitoringStats, SentryResult, SentryPerformance } from "@/services/admin/adminMonitoring";

type Tab = "stats" | "perf" | "errors";


interface Props {
  stats: Pick<MonitoringStats, "dailySignups" | "monthlySignups" | "yearlySignups" | "postTypes" | "regions">;
  sentry: SentryResult;
  performance: SentryPerformance;
}

export function MonitoringTabContent({ stats, sentry, performance }: Props) {
  const [tab, setTab] = useState<Tab>("stats");

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

  return (
    <>
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

      {tab === "stats" && <StatsTab stats={stats} />}
      {tab === "perf" && <PerfTab performance={performance} />}
      {tab === "errors" && <ErrorsTab sentry={sentry} />}
    </>
  );
}
