"use client";

import { useState } from "react";
import {
  BarChart2,
  ChevronLeft,
  Users,
  TrendingUp,
  AlertTriangle,
  ExternalLink,
  RefreshCw,
  Activity,
  Wifi,
  XCircle,
  AlertCircle,
  Info,
} from "lucide-react";
import Link from "next/link";

type DateTab = "daily" | "monthly" | "yearly";

const MOCK_DAU_SERIES = [
  12, 19, 15, 22, 18, 25, 30, 28, 24, 32, 35, 29, 27, 33, 38, 40, 36, 42, 39,
  45, 43, 48, 44, 50, 47, 52, 55, 49, 58, 61,
];

const MOCK_MAU_SERIES = [320, 410, 390, 480, 520, 610, 580, 640, 700, 720, 690, 750];

const MOCK_YEARLY_SERIES = [3200, 4100, 5800, 6700, 7200, 8100];
const MOCK_YEARLY_LABELS = ["2021", "2022", "2023", "2024", "2025", "2026"];

const MOCK_ERRORS = [
  {
    id: 1,
    level: "error" as const,
    title: "TypeError: Cannot read properties of undefined",
    location: "src/app/(auth)/login/page.tsx",
    count: 23,
    lastSeen: "5분 전",
    isNew: true,
  },
  {
    id: 2,
    level: "warning" as const,
    title: "Supabase: row-level security policy violation",
    location: "src/services/chat/messages.ts",
    count: 7,
    lastSeen: "18분 전",
    isNew: false,
  },
  {
    id: 3,
    level: "error" as const,
    title: "Unhandled promise rejection: fetch failed",
    location: "src/services/go/groupChat.ts",
    count: 4,
    lastSeen: "42분 전",
    isNew: false,
  },
  {
    id: 4,
    level: "info" as const,
    title: "Next.js: hydration mismatch detected",
    location: "src/components/common/header/Header.tsx",
    count: 2,
    lastSeen: "1시간 전",
    isNew: false,
  },
  {
    id: 5,
    level: "warning" as const,
    title: "Redis connection timeout (latency: 1240ms)",
    location: "src/utils/redis/client.ts",
    count: 1,
    lastSeen: "2시간 전",
    isNew: false,
  },
];

const LEVEL_CONFIG = {
  error: {
    icon: XCircle,
    badge: "bg-red-50 text-red-600 border-red-100",
    dot: "bg-red-500",
    label: "오류",
  },
  warning: {
    icon: AlertCircle,
    badge: "bg-amber-50 text-amber-600 border-amber-100",
    dot: "bg-amber-400",
    label: "경고",
  },
  info: {
    icon: Info,
    badge: "bg-blue-50 text-blue-600 border-blue-100",
    dot: "bg-blue-400",
    label: "정보",
  },
};

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
  const line =
    "M " + pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" L ");
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
          x1={0}
          x2={W}
          y1={top + f * (bottom - top)}
          y2={top + f * (bottom - top)}
          stroke="#eef2f5"
          strokeWidth={1}
        />
      ))}
      <path d={area} fill={`url(#${gradId})`} />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth={2.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
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

function getXLabels(values: number[], tab: DateTab): string[] {
  if (tab === "daily") {
    const today = new Date();
    return [0, 0.25, 0.5, 0.75, 1].map((f) => {
      const d = new Date(today);
      d.setDate(d.getDate() - Math.round((1 - f) * (values.length - 1)));
      return `${d.getMonth() + 1}/${d.getDate()}`;
    });
  }
  if (tab === "monthly") {
    const today = new Date();
    const months: string[] = [];
    for (let i = values.length - 1; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      months.push(`${d.getMonth() + 1}월`);
    }
    return [months[0], months[3], months[6], months[9], months[11]];
  }
  return [MOCK_YEARLY_LABELS[0], MOCK_YEARLY_LABELS[2], MOCK_YEARLY_LABELS[5]];
}

export default function MonitoringPage() {
  const [tab, setTab] = useState<DateTab>("daily");
  const [isPolling] = useState(true);

  const chartValues =
    tab === "daily"
      ? MOCK_DAU_SERIES
      : tab === "monthly"
        ? MOCK_MAU_SERIES
        : MOCK_YEARLY_SERIES;

  const xLabels = getXLabels(chartValues, tab);

  const activeCount = MOCK_DAU_SERIES[MOCK_DAU_SERIES.length - 1];
  const dau = MOCK_DAU_SERIES[MOCK_DAU_SERIES.length - 1];
  const mau = MOCK_MAU_SERIES[MOCK_MAU_SERIES.length - 1];
  const errorCount = MOCK_ERRORS.filter((e) => e.level === "error").length;

  const TAB_OPTIONS: { key: DateTab; label: string }[] = [
    { key: "daily", label: "일별" },
    { key: "monthly", label: "월별" },
    { key: "yearly", label: "연별" },
  ];

  const chartLabel =
    tab === "daily" ? "DAU (일간 활성 사용자)" : tab === "monthly" ? "MAU (월간 활성 사용자)" : "연간 활성 사용자";

  const chartSummary =
    tab === "daily"
      ? `오늘 ${dau.toLocaleString()}명 활성`
      : tab === "monthly"
        ? `이번달 ${mau.toLocaleString()}명 활성`
        : `올해 ${MOCK_YEARLY_SERIES[MOCK_YEARLY_SERIES.length - 1].toLocaleString()}명 활성`;

  return (
    <div className="p-6 lg:p-8">
      {/* Page header */}
      <div className="mb-7">
        <Link
          href="/admin/operation"
          className="mb-2 flex items-center gap-1 text-[13px] text-slate-400 hover:text-slate-600"
        >
          <ChevronLeft className="h-3.5 w-3.5" strokeWidth={2.5} />
          운영 관리
        </Link>
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50">
            <BarChart2 className="h-5 w-5 text-teal-600" strokeWidth={2} />
          </div>
          <h1 className="text-[24px] font-bold text-slate-900">통계 & 모니터링</h1>
        </div>
        <p className="mt-1 text-[13px] text-slate-500">
          DAU/MAU 추이, 실시간 접속자 수, 오류 로그를 확인합니다.
        </p>
      </div>

      {/* KPI 카드 */}
      <div className="mb-6 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
        {/* 실시간 접속자 */}
        <div className="rounded-2xl border border-[#edf0f2] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[13px] font-semibold text-slate-500">실시간 접속자</span>
            <div className="flex items-center gap-1.5">
              <span
                className={[
                  "h-2 w-2 rounded-full",
                  isPolling ? "animate-pulse bg-green-400" : "bg-slate-300",
                ].join(" ")}
              />
              <span className="text-[11px] text-slate-400">{isPolling ? "30초 갱신" : "중단"}</span>
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-[27px] font-extrabold tracking-tight text-slate-900">
              {activeCount.toLocaleString()}
            </span>
            <span className="ml-0.5 text-[14px] font-semibold text-slate-400">명</span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-[12px] text-green-500">
            <Wifi className="h-3.5 w-3.5" />
            <span>현재 온라인</span>
          </div>
        </div>

        {/* DAU */}
        <div className="rounded-2xl border border-[#edf0f2] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
          <span className="text-[13px] font-semibold text-slate-500">DAU (오늘)</span>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-[27px] font-extrabold tracking-tight text-slate-900">
              {dau.toLocaleString()}
            </span>
            <span className="ml-0.5 text-[14px] font-semibold text-slate-400">명</span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-[12px] text-teal-500">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>어제 대비 +12%</span>
          </div>
        </div>

        {/* MAU */}
        <div className="rounded-2xl border border-[#edf0f2] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
          <span className="text-[13px] font-semibold text-slate-500">MAU (이번달)</span>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-[27px] font-extrabold tracking-tight text-slate-900">
              {mau.toLocaleString()}
            </span>
            <span className="ml-0.5 text-[14px] font-semibold text-slate-400">명</span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-[12px] text-teal-500">
            <Activity className="h-3.5 w-3.5" />
            <span>전월 대비 +8%</span>
          </div>
        </div>

        {/* 오류 */}
        <div className="rounded-2xl border border-[#edf0f2] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
          <span className="text-[13px] font-semibold text-slate-500">미해결 오류</span>
          <div className="mt-3 flex items-baseline gap-1">
            <span
              className={[
                "text-[27px] font-extrabold tracking-tight",
                errorCount > 0 ? "text-red-500" : "text-slate-900",
              ].join(" ")}
            >
              {errorCount}
            </span>
            <span className="ml-0.5 text-[14px] font-semibold text-slate-400">건</span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-[12px] text-red-400">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>확인 필요</span>
          </div>
        </div>
      </div>

      {/* DAU/MAU 차트 */}
      <div className="mb-6 rounded-2xl border border-[#ebeef0] bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-[18px] font-extrabold tracking-tight text-slate-900">
              {chartLabel}
            </h2>
            <p className="mt-0.5 text-[13px] text-slate-400">{chartSummary}</p>
          </div>
          <div className="flex gap-1 rounded-xl border border-[#ebeef0] bg-slate-50 p-1">
            {TAB_OPTIONS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={[
                  "rounded-lg px-4 py-1.5 text-[13px] font-semibold transition-colors",
                  tab === key
                    ? "bg-white text-slate-800 shadow-sm"
                    : "text-slate-400 hover:text-slate-600",
                ].join(" ")}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {tab === "yearly" ? (
          <BarChart values={MOCK_YEARLY_SERIES} labels={MOCK_YEARLY_LABELS} />
        ) : (
          <>
            <TrendChart values={chartValues} />
            <div className="mt-2.5 flex justify-between px-0.5">
              {xLabels.map((l, i) => (
                <span key={i} className="text-[12px] font-medium text-slate-400">
                  {l}
                </span>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Sentry 오류 로그 */}
      <div className="rounded-2xl border border-[#ebeef0] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
        {/* 헤더 */}
        <div className="flex items-center justify-between border-b border-[#ebeef0] px-6 py-4">
          <div>
            <h2 className="text-[16px] font-bold text-slate-900">오류 로그</h2>
            <p className="mt-0.5 text-[12.5px] text-slate-400">Sentry 연동 · 최근 24시간</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 rounded-lg border border-[#ebeef0] px-3 py-1.5 text-[12.5px] font-medium text-slate-500 hover:bg-slate-50">
              <RefreshCw className="h-3.5 w-3.5" />
              새로고침
            </button>
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

        {/* 오류 목록 */}
        <div className="divide-y divide-[#ebeef0]">
          {MOCK_ERRORS.map((err) => {
            const cfg = LEVEL_CONFIG[err.level];
            const Icon = cfg.icon;
            return (
              <div
                key={err.id}
                className="flex items-start gap-4 px-6 py-4 transition-colors hover:bg-slate-50"
              >
                <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${err.level === "error" ? "text-red-500" : err.level === "warning" ? "text-amber-400" : "text-blue-400"}`} strokeWidth={2} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[13.5px] font-semibold text-slate-800 truncate">
                      {err.title}
                    </span>
                    {err.isNew && (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-bold text-red-500">
                        NEW
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-[12px] text-slate-400">{err.location}</p>
                </div>
                <div className="shrink-0 text-right">
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${cfg.badge}`}
                  >
                    {cfg.label}
                  </span>
                  <div className="mt-1.5 text-[12px] text-slate-400">
                    <span className="font-semibold text-slate-700">{err.count}회</span>
                    &nbsp;·&nbsp;{err.lastSeen}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 더보기 */}
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

      {/* 접속자 통계 (사용자 분포) */}
      <div className="mt-6 rounded-2xl border border-[#ebeef0] bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
        <h2 className="mb-4 text-[16px] font-bold text-slate-900">사용자 분포</h2>
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            { label: "신규 유저 비율", value: "18%", bar: 18, color: "bg-teal-400" },
            { label: "재방문 유저 비율", value: "62%", bar: 62, color: "bg-indigo-400" },
            { label: "이탈 유저 비율", value: "20%", bar: 20, color: "bg-rose-300" },
          ].map((item) => (
            <div key={item.label}>
              <div className="mb-2 flex items-center justify-between text-[13px]">
                <span className="font-medium text-slate-600">{item.label}</span>
                <span className="font-bold text-slate-900">{item.value}</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full ${item.color} transition-all duration-700`}
                  style={{ width: item.bar + "%" }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            { label: "평균 세션 시간", value: "4분 32초", icon: Activity },
            { label: "페이지뷰 / 세션", value: "6.8 페이지", icon: Users },
            { label: "모바일 비율", value: "73%", icon: Wifi },
          ].map(({ label, value, icon: Icon }) => (
            <div
              key={label}
              className="flex items-center gap-3 rounded-xl border border-[#ebeef0] px-4 py-3"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50">
                <Icon className="h-4 w-4 text-slate-400" />
              </div>
              <div>
                <p className="text-[11.5px] text-slate-400">{label}</p>
                <p className="text-[15px] font-bold text-slate-900">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
