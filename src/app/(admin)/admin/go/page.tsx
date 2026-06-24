"use client";

// 어드민 — 번개모임 관리 페이지

import { useEffect, useState, useMemo } from "react";
import {
  Zap, Search, X, Calendar, MapPin, Users,
  AlertTriangle, ChevronLeft, ChevronRight, ExternalLink, CircleOff
} from "lucide-react";
import { adminGetMeetups, adminForceEndMeetup } from "@/services/go/go";
import { TOPIC_META, TOPIC_OPTIONS } from "@/constants/meetupTopics";
import type { AdminMeetup } from "@/type/go";
import type { MeetupTopicKey } from "@/constants/meetupTopics";

// ─── 헬퍼 ─────────────────────────────────────────────────────

type StatusFilter = "all" | "active" | "upcoming" | "ended";

const STATUS_META = {
  active:   { label: "진행 중", color: "#059669", bg: "#dcfce7", border: "#bbf7d0" },
  upcoming: { label: "예정",    color: "#2563eb", bg: "#dbeafe", border: "#bfdbfe" },
  ended:    { label: "종료",    color: "#64748b", bg: "#f1f5f9", border: "#e2e8f0" },
} as const;

function TopicPill({ topic }: { topic: MeetupTopicKey }) {
  const m = TOPIC_META[topic] ?? TOPIC_META.other;
  return (
    <span
      className="inline-flex items-center rounded-[7px] px-2.5 py-0.5 text-[12.5px] font-bold whitespace-nowrap"
      style={{ background: m.bg, color: m.color }}
    >
      {m.label}
    </span>
  );
}

function StatusPill({ status }: { status: "active" | "upcoming" | "ended" }) {
  const m = STATUS_META[status];
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[12.5px] font-bold whitespace-nowrap"
      style={{ background: m.bg, color: m.color, border: `1px solid ${m.border}` }}
    >
      {m.label}
    </span>
  );
}

function Avatar({ name, size = 28 }: { name: string; size?: number }) {
  const colors = [
    { bg: "#fee2e2", fg: "#dc2626" }, { bg: "#dbeafe", fg: "#2563eb" },
    { bg: "#ede9fe", fg: "#7c3aed" }, { bg: "#ffedd5", fg: "#ea580c" },
    { bg: "#dcfce7", fg: "#16a34a" }, { bg: "#fce7f3", fg: "#db2777" },
  ];
  let i = 0;
  for (let c = 0; c < name.length; c++) i = (i + name.charCodeAt(c)) % colors.length;
  return (
    <div
      style={{ width: size, height: size, background: colors[i].bg, color: colors[i].fg }}
      className="flex flex-shrink-0 items-center justify-center rounded-full text-xs font-bold"
    >
      {name.charAt(0)}
    </div>
  );
}

// ─── 메인 페이지 ──────────────────────────────────────────────

const PAGE_SIZE = 8;

export default function AdminGoPage() {
  const [meetups, setMeetups] = useState<AdminMeetup[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [topicFilter, setTopicFilter] = useState<MeetupTopicKey | "all">("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [forceEndLoading, setForceEndLoading] = useState(false);
  const [toast, setToast] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const data = await adminGetMeetups();
      setMeetups(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2800);
  };

  // ─── 필터링 ─────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return meetups.filter((m) => {
      if (topicFilter !== "all" && m.topic !== topicFilter) return false;
      if (statusFilter !== "all" && m.status !== statusFilter) return false;
      if (q && ![m.title, m.location_address, m.host_name].join(" ").toLowerCase().includes(q)) return false;
      return true;
    });
  }, [meetups, topicFilter, statusFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const p = Math.min(page, totalPages);
  const pageItems = filtered.slice((p - 1) * PAGE_SIZE, p * PAGE_SIZE);
  const selected = meetups.find((m) => m.post_id === selectedId) ?? null;

  // ─── 통계 ────────────────────────────────────
  const stats = useMemo(() => ({
    active: meetups.filter((m) => m.status === "active").length,
    upcoming: meetups.filter((m) => m.status === "upcoming").length,
    participants: meetups.filter((m) => m.status === "active").reduce((s, m) => s + m.participant_count + 1, 0),
    reports: meetups.filter((m) => m.reports > 0).length,
  }), [meetups]);

  const handleForceEnd = async () => {
    if (selectedId === null || forceEndLoading) return;
    setForceEndLoading(true);
    try {
      await adminForceEndMeetup(selectedId);
      await load();
      setSelectedId(null);
      setConfirmEnd(false);
      showToast("모임이 강제 종료되었습니다");
    } catch {
      showToast("처리 중 오류가 발생했습니다");
    } finally {
      setForceEndLoading(false);
    }
  };

  const tabCls = (active: boolean) =>
    `whitespace-nowrap rounded-lg px-3.5 py-2 text-[13.5px] font-semibold transition-all ${
      active ? "bg-white text-teal-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
    }`;

  return (
    <div className="flex flex-col gap-5">

      {/* ── 헤더 ── */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Zap className="h-7 w-7 text-teal-500" strokeWidth={2.2} />
            <h1 className="text-[31px] font-extrabold tracking-tight text-slate-900">번개모임 관리</h1>
            <span className="rounded-md border border-teal-100 bg-teal-50 px-2.5 py-1 text-[12px] font-bold text-teal-600">칸토 go!</span>
          </div>
          <p className="mt-2 text-[15px] text-slate-500">진행 중인 번개모임을 모니터링하고 모더레이션하세요</p>
        </div>
        <div className="flex items-center gap-2 whitespace-nowrap rounded-[11px] border border-[#e7ebee] bg-white px-3.5 py-2.5 text-[13px] text-slate-500">
          전체 <span className="mx-1 font-bold text-slate-900">{meetups.length}</span>건 · 진행 중
          <span className="mx-1 font-bold text-teal-600">{stats.active}</span>건
        </div>
      </div>

      {/* ── 통계 카드 ── */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3.5">
        {[
          { label: "진행 중", value: stats.active, unit: "건", icon: Zap, iconColor: "#0d9488", iconBg: "#f0fdfa" },
          { label: "오늘 예정", value: stats.upcoming, unit: "건", icon: Calendar, iconColor: "#2563eb", iconBg: "#eff6ff" },
          { label: "총 참여자 (진행 중)", value: stats.participants, unit: "명", icon: Users, iconColor: "#0d9488", iconBg: "#f0fdfa" },
          { label: "신고 포함 모임", value: stats.reports, unit: "건", icon: AlertTriangle, iconColor: stats.reports > 0 ? "#dc2626" : "#94a3b8", iconBg: stats.reports > 0 ? "#fef2f2" : "#f1f5f9" },
        ].map(({ label, value, unit, icon: Icon, iconColor, iconBg }) => (
          <div key={label} className="flex items-center gap-4 rounded-[16px] border border-[#edf0f2] bg-white p-[18px]">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[13px]" style={{ background: iconBg }}>
              <Icon className="h-[22px] w-[22px]" style={{ color: iconColor }} strokeWidth={2} />
            </div>
            <div>
              <div className="text-[13px] font-semibold text-slate-500">{label}</div>
              <div className="text-[26px] font-extrabold tracking-tight" style={{ color: iconColor }}>
                {value}<span className="ml-0.5 text-[13px] font-semibold text-slate-400">{unit}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── 필터 ── */}
      <div className="flex flex-col gap-3.5 rounded-[16px] border border-[#e7ebee] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
        {/* 검색 */}
        <div className="flex items-center gap-2.5 rounded-[12px] border border-[#ebeef0] bg-[#f7f9fa] px-3.5 py-3">
          <Search className="h-[18px] w-[18px] flex-shrink-0 text-slate-400" strokeWidth={2} />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="모임 제목, 장소, 주최자로 검색..."
            className="flex-1 bg-transparent text-[14px] text-slate-900 outline-none placeholder:text-slate-400"
          />
        </div>

        <div className="flex flex-wrap items-start gap-6">
          {/* 주제 필터 */}
          <div>
            <div className="mb-2.5 text-[11.5px] font-bold uppercase tracking-widest text-slate-400">주제</div>
            <div className="flex flex-wrap gap-1.5">
              {[{ value: "all" as const, label: "전체" }, ...TOPIC_OPTIONS.map(o => ({ value: o.value, label: o.label }))].map((opt) => {
                const active = topicFilter === opt.value;
                const meta = opt.value !== "all" ? TOPIC_META[opt.value as MeetupTopicKey] : null;
                return (
                  <button
                    key={opt.value}
                    onClick={() => { setTopicFilter(opt.value as MeetupTopicKey | "all"); setPage(1); }}
                    className="rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition-all"
                    style={{
                      background: active ? (meta?.color ?? "#0f172a") : "#fff",
                      color: active ? "#fff" : (meta?.color ?? "#475569"),
                      borderColor: active ? (meta?.color ?? "#0f172a") : (meta?.border ?? "#e2e8f0"),
                    }}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 상태 탭 */}
          <div>
            <div className="mb-2.5 text-[11.5px] font-bold uppercase tracking-widest text-slate-400">상태</div>
            <div className="inline-flex gap-1 rounded-[11px] bg-[#f1f4f6] p-1">
              {(["all", "active", "upcoming", "ended"] as StatusFilter[]).map((s) => (
                <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }} className={tabCls(statusFilter === s)}>
                  {s === "all" ? "전체" : STATUS_META[s].label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── 테이블 ── */}
      <div className="overflow-hidden rounded-[18px] border border-[#e7ebee] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[740px] border-collapse">
            <thead>
              <tr className="border-b border-[#f1f4f6] bg-[#f8fafc]">
                {["주제", "모임 제목", "일시", "정원", "주최자", "상태", ""].map((h, i) => (
                  <th key={i} className="px-[18px] py-3 text-left text-[12px] font-bold uppercase tracking-[0.04em] text-slate-400">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="py-16 text-center text-[14px] text-slate-400">불러오는 중...</td></tr>
              ) : pageItems.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="flex flex-col items-center gap-3 py-16 text-center">
                      <Zap className="h-12 w-12 text-slate-200" strokeWidth={1.6} />
                      <div className="text-[15px] font-bold text-slate-500">조건에 맞는 모임이 없습니다</div>
                      <div className="text-[13.5px] text-slate-400">필터를 변경하거나 검색어를 지워보세요</div>
                    </div>
                  </td>
                </tr>
              ) : pageItems.map((m) => {
                const cap = Math.round(((m.participant_count + 1) / m.max_participants) * 100);
                const capColor = cap >= 90 ? "#ef4444" : cap >= 70 ? "#f97316" : "#14b8a6";
                const startDate = new Date(m.start_at);
                const endDate   = new Date(m.end_at);
                const dateStr   = `${startDate.getMonth()+1}/${startDate.getDate()}`;
                const timeRange = `${startDate.getHours().toString().padStart(2,"0")}:${startDate.getMinutes().toString().padStart(2,"0")} ~ ${endDate.getHours().toString().padStart(2,"0")}:${endDate.getMinutes().toString().padStart(2,"0")}`;
                return (
                  <tr
                    key={m.post_id}
                    onClick={() => { setSelectedId(m.post_id); setConfirmEnd(false); }}
                    className="cursor-pointer border-t border-[#f3f5f7] hover:bg-[#f8fafc]"
                  >
                    <td className="px-[18px] py-3.5"><TopicPill topic={m.topic} /></td>
                    <td className="px-[18px] py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="max-w-[240px] truncate text-[14px] font-bold text-slate-900">{m.title}</span>
                        {m.reports > 0 && (
                          <span className="flex-shrink-0 rounded-md border border-red-200 bg-red-50 px-1.5 py-0.5 text-[11px] font-bold text-red-600">
                            신고 {m.reports}건
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 max-w-[260px] truncate text-[12.5px] text-slate-400">{m.location_address}</div>
                    </td>
                    <td className="px-[18px] py-3.5">
                      <div className="text-[13.5px] font-semibold text-slate-700">{dateStr}</div>
                      <div className="mt-0.5 text-[12.5px] text-slate-400">{timeRange}</div>
                    </td>
                    <td className="px-[18px] py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 min-w-[44px] flex-1 overflow-hidden rounded-full bg-slate-100">
                          <div className="h-full rounded-full" style={{ width: `${cap}%`, background: capColor }} />
                        </div>
                        <span className="whitespace-nowrap text-[13px] font-bold text-slate-900">
                          {m.participant_count + 1}/{m.max_participants}
                        </span>
                      </div>
                    </td>
                    <td className="px-[18px] py-3.5">
                      <div className="flex items-center gap-2">
                        <Avatar name={m.host_name} size={28} />
                        <span className="max-w-[64px] truncate text-[13.5px] font-semibold text-slate-700">{m.host_name}</span>
                      </div>
                    </td>
                    <td className="px-[18px] py-3.5"><StatusPill status={m.status} /></td>
                    <td className="px-[18px] py-3.5 text-right">
                      <button className="rounded-[9px] border border-[#e2e8eb] bg-white px-3.5 py-1.5 text-[13px] font-bold text-slate-600 hover:bg-[#f7f9fa]">
                        상세
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between gap-3 border-t border-[#f1f4f6] px-5 py-4">
            <span className="text-[13px] text-slate-400">
              총 <span className="font-semibold text-slate-600">{filtered.length}</span>건
            </span>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={p <= 1}
                className="flex h-8 items-center gap-1 rounded-[9px] border border-[#e7ebee] bg-white px-3 text-[13px] font-semibold text-slate-500 disabled:opacity-40 hover:bg-[#f7f9fa]">
                <ChevronLeft className="h-3.5 w-3.5" strokeWidth={2.5} /> 이전
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button key={n} onClick={() => setPage(n)}
                  className={`h-8 min-w-[34px] rounded-[9px] border text-[13px] font-semibold ${p === n ? "border-teal-500 bg-teal-500 text-white" : "border-[#e7ebee] bg-white text-slate-500 hover:bg-[#f7f9fa]"}`}>
                  {n}
                </button>
              ))}
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={p >= totalPages}
                className="flex h-8 items-center gap-1 rounded-[9px] border border-[#e7ebee] bg-white px-3 text-[13px] font-semibold text-slate-500 disabled:opacity-40 hover:bg-[#f7f9fa]">
                다음 <ChevronRight className="h-3.5 w-3.5" strokeWidth={2.5} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── 상세 Drawer ── */}
      {selected && (
        <>
          <div onClick={() => setSelectedId(null)} className="fixed inset-0 z-[70] bg-slate-900/45" />
          <div className="fixed right-0 top-0 z-[71] flex h-screen w-[480px] max-w-full flex-col bg-white shadow-2xl animate-[slideInRight_.26s_cubic-bezier(.4,0,.2,1)]">

            {/* Drawer 헤더 */}
            <div className="flex-shrink-0 border-b border-slate-100 px-6 py-5">
              <div className="mb-3 flex items-start justify-between gap-3">
                <h2 className="flex-1 text-[18px] font-extrabold leading-snug tracking-tight text-slate-900">{selected.title}</h2>
                <button onClick={() => setSelectedId(null)} className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[9px] border border-slate-200 text-slate-500 hover:bg-slate-100">
                  <X className="h-[18px] w-[18px]" strokeWidth={2.2} />
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <TopicPill topic={selected.topic} />
                <StatusPill status={selected.status} />
                {selected.reports > 0 && (
                  <span className="flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[12.5px] font-bold text-red-600">
                    <AlertTriangle className="h-3.5 w-3.5" strokeWidth={2.2} />
                    신고 {selected.reports}건
                  </span>
                )}
              </div>
            </div>

            {/* Drawer 내용 */}
            <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-5">
              {/* 주최자 */}
              <div className="flex items-center gap-3.5 rounded-[14px] border border-slate-100 bg-slate-50 p-4">
                <Avatar name={selected.host_name} size={44} />
                <div>
                  <div className="text-[15px] font-bold text-slate-900">{selected.host_name}</div>
                  <div className="mt-0.5 text-[12.5px] text-slate-400">
                    주최자 · {new Date(selected.created_at).toLocaleDateString("ko-KR")} 개설
                  </div>
                </div>
              </div>

              {/* 일시/장소/설명 */}
              <div className="overflow-hidden rounded-[14px] border border-slate-100">
                {[
                  {
                    icon: Calendar,
                    label: "일시",
                    content: `${new Date(selected.start_at).toLocaleDateString("ko-KR")} · ${new Date(selected.start_at).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })} ~ ${new Date(selected.end_at).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}`,
                  },
                  {
                    icon: MapPin,
                    label: "장소",
                    content: selected.location_address + (selected.location_detail ? `\n${selected.location_detail}` : ""),
                  },
                ].map(({ icon: Icon, label, content }, idx) => (
                  <div key={label} className={`flex items-start gap-3.5 px-[18px] py-3.5 ${idx > 0 ? "border-t border-slate-100" : ""}`}>
                    <Icon className="mt-0.5 h-[17px] w-[17px] flex-shrink-0 text-slate-400" strokeWidth={2} />
                    <div>
                      <div className="mb-1 text-[12px] font-bold text-slate-400">{label}</div>
                      <div className="text-[14px] font-semibold text-slate-700 whitespace-pre-line">{content}</div>
                    </div>
                  </div>
                ))}
                <div className="flex items-start gap-3.5 border-t border-slate-100 px-[18px] py-3.5">
                  <Users className="mt-0.5 h-[17px] w-[17px] flex-shrink-0 text-slate-400" strokeWidth={2} />
                  <div className="w-full">
                    <div className="mb-2 text-[12px] font-bold text-slate-400">한줄 설명</div>
                    <div className="text-[14px] leading-relaxed text-slate-700">{selected.description}</div>
                  </div>
                </div>
              </div>

              {/* 참여자 */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-[13px] font-bold text-slate-900">참여자</span>
                  <span className="text-[13px] text-slate-400">
                    <span className="font-bold text-slate-900">{selected.participant_count + 1}</span>/{selected.max_participants}명
                  </span>
                </div>
                <div className="mb-4 h-[7px] overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(100, Math.round(((selected.participant_count + 1) / selected.max_participants) * 100))}%`,
                      background: "#14b8a6",
                    }}
                  />
                </div>
                <div className="flex flex-wrap gap-3">
                  <div className="flex flex-col items-center gap-1">
                    <div style={{ boxShadow: "0 0 0 2px #14b8a6" }} className="rounded-full">
                      <Avatar name={selected.host_name} size={40} />
                    </div>
                    <span className="text-[10.5px] font-bold text-teal-600">주최자</span>
                  </div>
                  {selected.participants.slice(0, 8).map((pt) => (
                    <div key={pt.id} className="flex flex-col items-center gap-1">
                      <Avatar name={pt.display_name} size={40} />
                      <span className="text-[10.5px] text-slate-400">참여자</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 신고 섹션 */}
              {selected.reports > 0 && (
                <div className="overflow-hidden rounded-[14px] border border-red-200">
                  <div className="flex items-center gap-2.5 border-b border-red-200 bg-red-50 px-[18px] py-3.5">
                    <AlertTriangle className="h-4 w-4 text-red-600" strokeWidth={2.2} />
                    <span className="text-[14px] font-bold text-red-600">신고 {selected.reports}건 접수됨</span>
                  </div>
                  <div className="px-[18px] py-3.5">
                    <p className="mb-3.5 text-[13.5px] leading-relaxed text-slate-700">
                      이 모임에 신고가 접수되었습니다. 신고 내역 페이지에서 상세 내용을 확인하고 조치하세요.
                    </p>
                    <a
                      href="/admin/reports"
                      className="inline-flex items-center gap-1.5 rounded-[10px] bg-slate-900 px-4 py-2 text-[13px] font-bold text-white"
                    >
                      신고 내역 보기 <ExternalLink className="h-3.5 w-3.5" strokeWidth={2.2} />
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Drawer 푸터 — 강제 종료 */}
            <div className="flex-shrink-0 border-t border-slate-100 px-6 py-4">
              {selected.status === "ended" ? (
                <div className="flex items-center justify-center gap-2 rounded-[11px] bg-slate-50 py-3 text-[13.5px] font-semibold text-slate-500">
                  종료된 모임입니다
                </div>
              ) : confirmEnd ? (
                <div className="flex flex-col gap-3 rounded-[13px] border border-orange-200 bg-orange-50 p-4">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-orange-700" strokeWidth={2.1} />
                    <div>
                      <div className="text-[14px] font-bold text-slate-900">모임을 강제 종료하시겠습니까?</div>
                      <div className="mt-1 text-[13px] text-slate-500">참여자에게 종료 알림이 발송되고 지도에서 핀이 사라집니다.</div>
                    </div>
                  </div>
                  <div className="flex gap-2.5">
                    <button onClick={() => setConfirmEnd(false)} className="flex-1 rounded-[11px] border border-slate-200 bg-white py-3 text-[14px] font-bold text-slate-600 hover:bg-slate-50">취소</button>
                    <button onClick={handleForceEnd} disabled={forceEndLoading}
                      className="flex flex-[1.4] items-center justify-center gap-2 rounded-[11px] bg-red-600 py-3 text-[14px] font-bold text-white shadow-[0_4px_12px_rgba(220,38,38,.28)] hover:bg-red-700 disabled:opacity-60">
                      {forceEndLoading ? "처리 중..." : "강제 종료 확인"}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmEnd(true)}
                  className="flex w-full items-center justify-center gap-2 rounded-[11px] border border-red-200 bg-red-50 py-3.5 text-[14px] font-bold text-red-600 hover:bg-red-100"
                >
                  <CircleOff className="h-4 w-4" strokeWidth={2.2} />
                  모임 강제 종료
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {/* 토스트 */}
      {toast && (
        <div className="fixed bottom-7 left-1/2 z-[90] flex -translate-x-1/2 items-center gap-2.5 whitespace-nowrap rounded-xl bg-slate-900 px-5 py-3.5 text-[13.5px] font-semibold text-white shadow-2xl">
          <span className="text-emerald-400">✓</span>
          {toast}
        </div>
      )}
    </div>
  );
}
