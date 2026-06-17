"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { AlertTriangle, ArrowRight, Clock, Eye } from "lucide-react";
import {
  CATEGORY,
  CAT_ORDER,
  daysSince,
  type Category,
  type DashboardData,
} from "../_lib/constants";

function reportStatusFromCount(count: number) {
  if (count >= 5)
    return {
      label: "경고",
      sc: "#dc2626",
      sb: "#fef2f2",
      ab: "#fee2e2",
      ac: "#dc2626",
    };
  if (count >= 3)
    return {
      label: "주의",
      sc: "#d97706",
      sb: "#fffbeb",
      ab: "#fef3c7",
      ac: "#d97706",
    };
  if (count >= 2)
    return {
      label: "검토중",
      sc: "#2563eb",
      sb: "#eff6ff",
      ab: "#dbeafe",
      ac: "#2563eb",
    };
  return {
    label: "확인중",
    sc: "#64748b",
    sb: "#f1f5f9",
    ab: "#e2e8f0",
    ac: "#64748b",
  };
}

/* 차트 */

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
    <svg
      viewBox="0 0 620 180"
      preserveAspectRatio="none"
      width="100%"
      height={210}
    >
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
      return [
        ...acc,
        { name: c.name, frac: c.value / total, offset: prevOffset },
      ];
    }, []);
  return (
    <svg
      viewBox="0 0 120 120"
      width="100%"
      height="100%"
      style={{ transform: "rotate(-90deg)" }}
    >
      <circle
        cx={60}
        cy={60}
        r={R}
        fill="none"
        stroke="#f1f5f9"
        strokeWidth={15}
      />
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

function Card({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-[18px] border border-[#e7ebee] bg-white p-6 shadow-[0_1px_2px_rgba(16,24,40,0.04)] ${className}`}
    >
      {children}
    </div>
  );
}

export default function DashboardClient({ data }: { data: DashboardData }) {
  const [tab, setTab] = useState<"members" | "posts">("members");
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
  const regionTotal = data.regions.reduce((s, r) => s + r.count, 0) || 1;

  const KPIS = [
    { label: "총 회원수", value: data.totalUsers.toLocaleString(), unit: "명" },
    {
      label: "활성 사용자 (7일)",
      value: data.activeUsers.toLocaleString(),
      unit: "명",
    },
    { label: "오늘 신규 가입", value: `+${data.todaySignups}`, unit: "명" },
    { label: "총 게시글", value: data.totalPosts.toLocaleString(), unit: "건" },
    { label: "오늘 신규 게시글", value: `+${data.todayPosts}`, unit: "건" },
  ];

  return (
    <>
      {/* 제목 */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[31px] font-extrabold tracking-tight text-slate-900">
            대시보드
          </h1>
          <p className="mt-1.5 text-[15px] text-slate-500">
            필리핀 한인 커뮤니티 Kanto 운영 현황을 한눈에 확인하세요
          </p>
        </div>
        <span className="flex items-center gap-1.5 whitespace-nowrap rounded-[11px] border border-[#e7ebee] bg-white px-[13px] py-[9px] text-[13px] font-medium text-slate-400">
          <Clock className="h-[15px] w-[15px]" strokeWidth={2} />
          {timeStr} 기준
        </span>
      </div>

      {/* 긴급 신고 처리 배너 */}
      {data.pendingTotal > 0 && (
        <div className="flex flex-wrap items-center gap-5 rounded-2xl border border-[#fbd5d5] border-l-[5px] border-l-red-500 bg-white px-[22px] py-[18px] shadow-[0_4px_18px_rgba(239,68,68,0.08)]">
          <div className="flex h-[50px] w-[50px] flex-shrink-0 items-center justify-center rounded-[14px] bg-red-50">
            <AlertTriangle
              className="h-[25px] w-[25px] text-red-500"
              strokeWidth={2.1}
            />
          </div>
          <div className="min-w-[200px] flex-1">
            <div className="text-[17px] font-extrabold text-slate-900">
              <span className="text-red-600">{data.pendingTotal}건</span>의
              신고가 처리를 기다리고 있어요
            </div>
            <div className="mt-1 text-[14px] text-slate-500">
              회원 신고 {data.pendingUser}건 · 게시글 신고 {data.pendingPost}건
              {data.oldestDays !== null && (
                <>
                  {" "}
                  — 가장 오래된 신고는{" "}
                  <span className="font-semibold text-red-600">
                    {data.oldestDays}일
                  </span>{" "}
                  경과
                </>
              )}
            </div>
          </div>
          <button className="flex items-center gap-1.5 whitespace-nowrap rounded-[11px] bg-red-500 px-5 py-3 text-[14px] font-bold text-white shadow-[0_6px_16px_rgba(239,68,68,0.3)] hover:bg-red-600">
            지금 처리하기
            <ArrowRight className="h-[17px] w-[17px]" strokeWidth={2.2} />
          </button>
        </div>
      )}

      {/* KPI 카드 5개 */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(210px,1fr))] gap-4">
        {KPIS.map((k) => (
          <div
            key={k.label}
            className="rounded-2xl border border-[#edf0f2] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]"
          >
            <span className="text-[13px] font-semibold text-slate-500">
              {k.label}
            </span>
            <div className="mt-3.5">
              <div className="text-[27px] font-extrabold tracking-tight text-slate-900">
                {k.value}
                <span className="ml-0.5 text-[14px] font-semibold text-slate-400">
                  {k.unit}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 차트 + 도넛 */}
      <div className="flex flex-wrap gap-5">
        <Card className="flex-[1.7_1_420px]">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-[18px] font-extrabold tracking-tight text-slate-900">
                신규 가입자 추이
              </h2>
              <p className="mt-0.5 text-[13px] text-slate-400">
                최근 30일 기준
              </p>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[24px] font-extrabold tracking-tight text-teal-600">
                {data.sumSignups}
              </span>
              <span className="text-[13px] text-slate-400">명 신규 가입</span>
            </div>
          </div>
          <TrendChart signups={data.signupValues} />
          <div className="mt-2.5 flex justify-between px-0.5">
            {data.xLabels.map((l, i) => (
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
              <Donut data={data.donutData} />
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[12px] font-medium text-slate-400">
                  전체
                </span>
                <span className="text-[24px] font-extrabold tracking-tight text-slate-900">
                  {data.totalPosts.toLocaleString()}
                </span>
              </div>
            </div>
            <div className="flex min-w-[150px] flex-1 flex-col gap-4">
              {data.donutData.map((c) => (
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
          {data.todayByCat.length > 0 && (
            <div className="mt-[18px] border-t border-[#f1f4f6] pt-4">
              <div className="mb-3 text-[12.5px] font-semibold text-slate-400">
                오늘 카테고리별 신규 게시글 · 총 +{data.todayPosts}건
              </div>
              <div className="flex flex-wrap gap-x-5 gap-y-3">
                {data.todayByCat.map((t) => (
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

      {/*  지역별 + 인기 게시글  */}
      <div className="flex flex-wrap gap-5">
        <Card className="flex-[1_1_320px]">
          <h2 className="mb-5 text-[18px] font-extrabold tracking-tight text-slate-900">
            최근 7일 지역별 신규 게시글
          </h2>
          {data.regions.length === 0 ? (
            <div className="flex flex-col gap-4">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-8 animate-pulse rounded-lg bg-slate-100"
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {data.regions.map((r) => (
                <div key={r.name}>
                  <div className="mb-[7px] flex items-center justify-between">
                    <span className="whitespace-nowrap text-[14px] font-semibold text-slate-700">
                      {r.name}
                    </span>
                    <span className="text-[13px] text-slate-400">
                      <span className="font-bold text-slate-900">
                        {r.count.toLocaleString()}
                      </span>
                      건 · {Math.round((r.count / regionTotal) * 100)}%
                    </span>
                  </div>
                  <div className="h-[9px] overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-teal-500 to-teal-600"
                      style={{
                        width: `${Math.round((r.count / (data.regions[0]?.count || 1)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="flex-[1_1_320px]">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[18px] font-extrabold tracking-tight text-slate-900">
              인기 게시글 Top 5
            </h2>
            <span className="text-[13px] text-slate-400">조회수 기준</span>
          </div>
          {data.topPosts.length === 0 ? (
            <div className="flex flex-col gap-3">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-12 animate-pulse rounded-lg bg-slate-100"
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col">
              {data.topPosts.map((p) => (
                <div
                  key={p.rank}
                  className="flex items-center gap-3.5 border-b border-[#f3f5f7] px-1.5 py-[11px] hover:bg-slate-50"
                >
                  <span className="w-[18px] flex-shrink-0 text-center text-[15px] font-extrabold text-slate-300">
                    {p.rank}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[14.5px] font-semibold text-slate-900">
                      {p.title}
                    </div>
                    <span
                      className="mt-1.5 inline-flex items-center rounded-md px-2 py-0.5 text-[11.5px] font-semibold"
                      style={{
                        background: CATEGORY[p.cat]?.bg ?? "#f8fafc",
                        color: CATEGORY[p.cat]?.fg ?? "#64748b",
                      }}
                    >
                      {p.cat}
                    </span>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-1.5 text-slate-400">
                    <Eye className="h-[15px] w-[15px]" strokeWidth={2} />
                    <span className="text-[13px] font-semibold text-slate-500">
                      {p.views}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/*  신고 처리  + 신고 유형 분포  */}
      <div className="flex flex-wrap gap-5">
        <Card className="flex h-[520px] min-w-0 flex-[1.3_1_440px] flex-col overflow-hidden">
          <div className="mb-3.5 flex items-center gap-2.5">
            <h2 className="text-[18px] font-extrabold tracking-tight text-slate-900">
              신고 처리 큐
            </h2>
            <span className="rounded-full bg-red-50 px-2.5 py-[3px] text-[12px] font-bold text-red-600">
              {data.pendingTotal}건 대기
            </span>
          </div>
          <div className="mb-2 flex w-full gap-1 rounded-[11px] bg-slate-100 p-1">
            <button
              onClick={() => setTab("members")}
              className={[
                "flex-1 rounded-lg px-3.5 py-2 text-[13.5px] font-semibold",
                tab === "members"
                  ? "bg-white text-teal-600 shadow-sm"
                  : "text-slate-500",
              ].join(" ")}
            >
              신고된 회원 · {data.reportedUsers.length}
            </button>
            <button
              onClick={() => setTab("posts")}
              className={[
                "flex-1 rounded-lg px-3.5 py-2 text-[13.5px] font-semibold",
                tab === "posts"
                  ? "bg-white text-teal-600 shadow-sm"
                  : "text-slate-500",
              ].join(" ")}
            >
              신고된 게시글 · {data.reportedPosts.length}
            </button>
          </div>

          <div className="flex-1 overflow-hidden">
            {tab === "members" ? (
              <div className="flex flex-col">
                {data.reportedUsers.length === 0 ? (
                  <p className="py-8 text-center text-[14px] text-slate-400">
                    신고된 회원이 없습니다
                  </p>
                ) : (
                  data.reportedUsers.slice(0, 4).map((m) => {
                    const st = reportStatusFromCount(Number(m.report_count));
                    return (
                      <div
                        key={m.user_id}
                        className="flex cursor-pointer items-center gap-3 border-t border-[#f3f5f7] px-1.5 py-3 hover:bg-slate-50"
                      >
                        <div
                          className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full text-sm font-bold"
                          style={{ background: st.ab, color: st.ac }}
                        >
                          {m.avatar_url ? (
                            <Image
                              src={m.avatar_url}
                              alt={m.name}
                              width={40}
                              height={40}
                              className="h-full w-full object-cover"
                              unoptimized
                            />
                          ) : (
                            m.name[0]
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate text-[14.5px] font-bold text-slate-900">
                              {m.name}
                            </span>
                            <span
                              className="whitespace-nowrap rounded-md px-[7px] py-0.5 text-[11.5px] font-bold"
                              style={{ background: st.sb, color: st.sc }}
                            >
                              {st.label}
                            </span>
                          </div>
                          <div className="mt-0.5 truncate text-[12.5px] text-slate-400">
                            {m.latest_reason} · 신고 {Number(m.report_count)}회
                          </div>
                        </div>
                        <button className="flex-shrink-0 whitespace-nowrap rounded-[9px] border border-[#e2e8eb] bg-[#eef2f6] px-3.5 py-[7px] text-[13px] font-bold text-slate-700 hover:bg-slate-200">
                          처리
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            ) : (
              <div className="flex flex-col">
                {data.reportedPosts.length === 0 ? (
                  <p className="py-8 text-center text-[14px] text-slate-400">
                    신고된 게시글이 없습니다
                  </p>
                ) : (
                  data.reportedPosts.slice(0, 4).map((p) => {
                    const cat = (
                      p.post_type in CAT_ORDER ? p.post_type : "커뮤니티"
                    ) as Category;
                    const ago = daysSince(p.first_reported_at);
                    return (
                      <div
                        key={p.post_id}
                        className="flex cursor-pointer items-center gap-3 border-t border-[#f3f5f7] px-1.5 py-3 hover:bg-slate-50"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[14.5px] font-bold text-slate-900">
                            {p.title}
                          </div>
                          <div className="mt-1.5 flex items-center gap-2">
                            <span
                              className="inline-flex flex-shrink-0 items-center whitespace-nowrap rounded-md px-2 py-0.5 text-[11.5px] font-semibold"
                              style={{
                                background: CATEGORY[cat]?.bg ?? "#f8fafc",
                                color: CATEGORY[cat]?.fg ?? "#64748b",
                              }}
                            >
                              {cat}
                            </span>
                            <span className="whitespace-nowrap text-[12.5px] text-slate-400">
                              신고 {Number(p.report_count)}건 ·{" "}
                              {ago === 0
                                ? "오늘"
                                : ago === 1
                                  ? "어제"
                                  : `${ago}일 전`}
                            </span>
                          </div>
                        </div>
                        <button className="flex-shrink-0 whitespace-nowrap rounded-[9px] border border-[#e2e8eb] bg-[#eef2f6] px-3.5 py-[7px] text-[13px] font-bold text-slate-700 hover:bg-slate-200">
                          처리
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          <div className="mt-4 border-t border-[#f1f4f6] pt-4">
            <a
              href={tab === "members" ? "/admin/users" : "/admin/posts"}
              className="flex w-full items-center justify-center gap-1.5 rounded-[11px] border border-[#e2e8eb] bg-[#f8fafc] py-2.5 text-[13.5px] font-semibold text-slate-600 hover:bg-slate-100"
            >
              <Eye className="h-[15px] w-[15px]" strokeWidth={2} />
              {tab === "members"
                ? `회원 관리 전체 보기${data.reportedUsers.length > 4 ? ` (+${data.reportedUsers.length - 4}건)` : ""}`
                : `글 관리 전체 보기${data.reportedPosts.length > 4 ? ` (+${data.reportedPosts.length - 4}건)` : ""}`}
            </a>
          </div>
        </Card>

        {/* 신고 유형 분포 */}
        <Card className="flex h-[520px] flex-[1_1_300px] flex-col">
          <div className="mb-[18px]">
            <h2 className="text-[18px] font-extrabold tracking-tight text-slate-900">
              신고 유형 분포
            </h2>
            <p className="mt-0.5 text-[13px] text-slate-400">
              최근 30일 · 총 {data.reportTypes.reduce((s, t) => s + t.count, 0)}
              건
            </p>
          </div>
          {data.reportTypes.length === 0 ? (
            <div className="flex flex-col gap-4">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="h-8 animate-pulse rounded-lg bg-slate-100"
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-[15px]">
              {data.reportTypes.map((t) => (
                <div key={t.name}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="whitespace-nowrap text-[14px] font-semibold text-slate-700">
                      {t.name}
                    </span>
                    <span className="text-[13px] text-slate-400">
                      <span className="font-bold text-slate-900">
                        {t.count}
                      </span>
                      건 · {t.pct}
                    </span>
                  </div>
                  <div className="h-[9px] overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full"
                      style={{ width: t.w, background: t.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="flex-1" />
          <div className="mt-[18px] flex flex-wrap gap-2.5 border-t border-[#f1f4f6] pt-4">
            {[
              {
                label: "이번 주 처리",
                value: `${data.reportStats.weekResolved}건`,
                color: "text-slate-900",
              },
              {
                label: "처리율",
                value: `${data.reportStats.resolveRate}%`,
                color: "text-emerald-600",
              },
              {
                label: "평균 처리",
                value:
                  data.reportStats.avgHours !== null
                    ? `${data.reportStats.avgHours}시간`
                    : "—",
                color: "text-slate-900",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="flex min-w-[90px] flex-1 flex-col gap-0.5"
              >
                <span className="text-[12px] font-medium text-slate-400">
                  {s.label}
                </span>
                <span className={`text-[17px] font-extrabold ${s.color}`}>
                  {s.value}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
