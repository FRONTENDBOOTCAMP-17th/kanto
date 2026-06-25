"use client";

import { useState } from "react";
import type { MonitoringStats } from "@/services/admin/adminMonitoring";

type DateTab = "daily" | "monthly" | "yearly";

const TAB_OPTIONS: { key: DateTab; label: string }[] = [
  { key: "daily", label: "일별" },
  { key: "monthly", label: "월별" },
  { key: "yearly", label: "연별" },
];

function TrendChart({ values, color = "#14b8a6" }: { values: number[]; color?: string }) {
  const W = 620;
  const top = 12;
  const bottom = 172;

  if (values.length < 2)
    return <div className="h-[210px] animate-pulse rounded-xl bg-slate-100" />;

  const max = Math.max(...values) * 1.18 || 1;
  const pts = values.map((v, i) => [
    (i / (values.length - 1)) * W,
    top + (1 - v / max) * (bottom - top),
  ]);
  const line = "M " + pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" L ");
  const area = `${line} L ${W} ${bottom} L 0 ${bottom} Z`;
  const gradId = `grad-${color.replace("#", "")}`;

  return (
    <svg viewBox="0 0 620 180" preserveAspectRatio="none" width="100%" height={210}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.22} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      {[0, 0.25, 0.5, 0.75, 1].map((f) => (
        <line
          key={f}
          x1={0} x2={W}
          y1={top + f * (bottom - top)} y2={top + f * (bottom - top)}
          stroke="#eef2f5" strokeWidth={1}
        />
      ))}
      <path d={area} fill={`url(#${gradId})`} />
      <path d={line} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function BarChart({ values, labels }: { values: number[]; labels: string[] }) {
  const max = Math.max(...values) * 1.15 || 1;
  return (
    <div className="mt-2 flex h-[210px] items-end gap-1.5">
      {values.map((v, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
          <div className="flex w-full flex-1 items-end">
            <div
              className="w-full rounded-t-md bg-teal-400 transition-all duration-500"
              style={{ height: `${(v / max) * 100}%`, minHeight: 4 }}
            />
          </div>
          <span className="text-[10px] font-medium text-slate-400">{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}

interface Props {
  dailySignups: MonitoringStats["dailySignups"];
  monthlySignups: MonitoringStats["monthlySignups"];
  yearlySignups: MonitoringStats["yearlySignups"];
}

export function MonitoringTrendChart({ dailySignups, monthlySignups, yearlySignups }: Props) {
  const [tab, setTab] = useState<DateTab>("daily");

  const daily = { values: dailySignups.map((d) => d.count), labels: dailySignups.map((d) => d.day) };
  const monthly = { values: monthlySignups.map((d) => d.count), labels: monthlySignups.map((d) => d.month) };
  const yearly = { values: yearlySignups.map((d) => d.count), labels: yearlySignups.map((d) => d.year) };

  const current = tab === "daily" ? daily : tab === "monthly" ? monthly : yearly;
  const total = current.values.reduce((a, b) => a + b, 0);

  const xLabels = (() => {
    const n = current.labels.length;
    if (n === 0) return [];
    const indices = [0, Math.floor(n * 0.25), Math.floor(n * 0.5), Math.floor(n * 0.75), n - 1];
    return indices.map((i) => {
      const raw = current.labels[i] ?? "";
      if (tab === "daily") {
        const d = new Date(raw);
        return `${d.getMonth() + 1}/${d.getDate()}`;
      }
      if (tab === "monthly") {
        const [, m] = raw.split("-");
        return `${parseInt(m)}월`;
      }
      return raw;
    });
  })();

  const chartLabel =
    tab === "daily" ? "신규 가입자 (일별)" : tab === "monthly" ? "신규 가입자 (월별)" : "신규 가입자 (연별)";

  const chartSummary =
    tab === "daily"
      ? `최근 30일 ${total.toLocaleString()}명 가입`
      : tab === "monthly"
        ? `최근 12개월 ${total.toLocaleString()}명 가입`
        : `전체 ${total.toLocaleString()}명 가입`;

  return (
    <div className="mb-6 rounded-2xl border border-[#ebeef0] bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-[18px] font-extrabold tracking-tight text-slate-900">{chartLabel}</h2>
          <p className="mt-0.5 text-[13px] text-slate-400">{chartSummary}</p>
        </div>
        <div className="flex gap-1 rounded-xl border border-[#ebeef0] bg-slate-50 p-1">
          {TAB_OPTIONS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={[
                "rounded-lg px-4 py-1.5 text-[13px] font-semibold transition-colors",
                tab === key ? "bg-white text-slate-800 shadow-sm" : "text-slate-400 hover:text-slate-600",
              ].join(" ")}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {tab === "yearly" ? (
        <BarChart values={current.values} labels={current.labels} />
      ) : (
        <>
          <TrendChart values={current.values} />
          <div className="mt-2.5 flex justify-between px-0.5">
            {xLabels.map((l, i) => (
              <span key={i} className="text-[12px] font-medium text-slate-400">{l}</span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
