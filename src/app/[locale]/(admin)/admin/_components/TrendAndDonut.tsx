import { CATEGORY } from "../_lib/constants";
import type { Category } from "@/type/admin";
import Card from "./Card";

function TrendChart({ signups }: { signups: number[] }) {
  const W = 620,
    top = 12,
    bottom = 172;
  if (signups.length < 2)
    return <div className="h-[210px] animate-pulse rounded-xl bg-slate-100" />;
  const max = Math.max(...signups) * 1.18 || 1;
  const pts = signups.map((v, i) => [
    (i / (signups.length - 1)) * W,
    top + (1 - v / max) * (bottom - top),
  ]);
  const line =
    "M " + pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" L ");
  const area = `${line} L ${W} ${bottom} L 0 ${bottom} Z`;
  return (
    <svg viewBox="0 0 620 180" preserveAspectRatio="none" width="100%" height={210}>
      <defs>
        <linearGradient id="fintg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#14b8a6" stopOpacity={0.24} />
          <stop offset="100%" stopColor="#14b8a6" stopOpacity={0} />
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
      <path d={area} fill="url(#fintg)" />
      <path
        d={line}
        fill="none"
        stroke="#14b8a6"
        strokeWidth={2.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Donut({ data }: { data: { name: Category; value: number }[] }) {
  const total = data.reduce((s, c) => s + c.value, 0) || 1;
  const R = 42,
    C = 2 * Math.PI * R;
  const segments = data
    .filter((c) => c.value > 0)
    .reduce<{ name: Category; frac: number; offset: number }[]>((acc, c) => {
      const prevOffset = acc.length
        ? acc[acc.length - 1].offset + acc[acc.length - 1].frac * C
        : 0;
      return [...acc, { name: c.name, frac: c.value / total, offset: prevOffset }];
    }, []);
  return (
    <svg
      viewBox="0 0 120 120"
      width="100%"
      height="100%"
      style={{ transform: "rotate(-90deg)" }}
    >
      <circle cx={60} cy={60} r={R} fill="none" stroke="#f1f5f9" strokeWidth={15} />
      {segments.map((seg) => (
        <circle
          key={seg.name}
          cx={60}
          cy={60}
          r={R}
          fill="none"
          stroke={CATEGORY[seg.name].fg}
          strokeWidth={15}
          strokeDasharray={`${seg.frac * C} ${C - seg.frac * C}`}
          strokeDashoffset={-seg.offset}
        />
      ))}
    </svg>
  );
}

interface Props {
  signupValues: number[];
  sumSignups: string;
  xLabels: string[];
  donutData: { name: Category; value: number; pct: string }[];
  todayByCat: { name: Category; delta: number }[];
  todayPosts: number;
  totalPosts: number;
}

export default function TrendAndDonut({
  signupValues,
  sumSignups,
  xLabels,
  donutData,
  todayByCat,
  todayPosts,
  totalPosts,
}: Props) {
  return (
    <div className="flex flex-wrap gap-5">
      <Card className="flex-[1.7_1_420px]">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-[18px] font-extrabold tracking-tight text-slate-900">
              신규 가입자 추이
            </h2>
            <p className="mt-0.5 text-[13px] text-slate-400">최근 30일 기준</p>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-[24px] font-extrabold tracking-tight text-teal-600">
              {sumSignups}
            </span>
            <span className="text-[13px] text-slate-400">명 신규 가입</span>
          </div>
        </div>
        <TrendChart signups={signupValues} />
        <div className="mt-2.5 flex justify-between px-0.5">
          {xLabels.map((l, i) => (
            <span key={i} className="text-[12px] font-medium text-slate-400">
              {l}
            </span>
          ))}
        </div>
      </Card>

      <Card className="flex flex-[1_1_280px] flex-col">
        <h2 className="mb-4 text-[18px] font-extrabold tracking-tight text-slate-900">
          카테고리별 게시글 분포
        </h2>
        <div className="flex flex-1 flex-wrap items-center gap-6">
          <div className="relative h-[152px] w-[152px] flex-shrink-0">
            <Donut data={donutData} />
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[12px] font-medium text-slate-400">전체</span>
              <span className="text-[24px] font-extrabold tracking-tight text-slate-900">
                {totalPosts.toLocaleString()}
              </span>
            </div>
          </div>
          <div className="flex min-w-[150px] flex-1 flex-col gap-4">
            {donutData.map((c) => (
              <div key={c.name} className="flex items-center gap-2.5">
                <span
                  className="h-[11px] w-[11px] flex-shrink-0 rounded-[3px]"
                  style={{ background: CATEGORY[c.name].fg }}
                />
                <span className="flex-1 whitespace-nowrap text-[14px] font-semibold text-slate-700">
                  {c.name}
                </span>
                <span className="whitespace-nowrap text-[13px] text-slate-400">
                  {c.value.toLocaleString()}건
                </span>
                <span className="min-w-[40px] text-right text-[14px] font-bold text-slate-900">
                  {c.pct}
                </span>
              </div>
            ))}
          </div>
        </div>
        {todayByCat.length > 0 && (
          <div className="mt-[18px] border-t border-[#f1f4f6] pt-4">
            <div className="mb-3 text-[12.5px] font-semibold text-slate-400">
              오늘 카테고리별 신규 게시글 · 총 +{todayPosts}건
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-3">
              {todayByCat.map((t) => (
                <div key={t.name} className="flex items-center gap-1.5">
                  <span
                    className="h-[9px] w-[9px] flex-shrink-0 rounded-[3px]"
                    style={{ background: CATEGORY[t.name].fg }}
                  />
                  <span className="text-[13px] font-semibold text-slate-700">
                    {t.name}
                  </span>
                  <span className="text-[13px] font-bold text-teal-600">
                    +{t.delta}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
