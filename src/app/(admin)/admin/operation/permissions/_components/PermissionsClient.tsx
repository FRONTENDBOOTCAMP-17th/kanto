"use client";

import React, { useState, useRef, useEffect, useTransition } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  KeyRound,
  Trash2,
  UserPlus,
  X,
  Check,
  ShieldCheck,
  Crown,
  Search,
  User,
  Users,
  Plus,
  FolderOpen,
} from "lucide-react";
import { ShieldAlert } from "lucide-react";
import {
  type AdminPermission,
  type Team,
  type AdminAccount,
  type UserResult,
  searchUsers,
  promoteToAdmin,
  revokeAdmin,
  createTeam,
  deleteTeam,
  setTeamPermissions,
  assignTeam,
  setAdminRole,
} from "../actions";

const PERMISSIONS: { key: AdminPermission; label: string; description: string }[] = [
  { key: "delete_post",    label: "게시글 삭제", description: "게시글·댓글 삭제" },
  { key: "handle_report",  label: "신고 처리",   description: "신고 승인·기각" },
  { key: "sanction_user",  label: "유저 제재",   description: "정지·영구정지" },
  { key: "write_notice",   label: "공지 작성",   description: "공지 등록·수정" },
  { key: "view_stats",     label: "통계 조회",   description: "DAU/MAU 열람" },
  { key: "view_chat",      label: "채팅 열람",   description: "채팅 내역 조회" },
];

type Tab = "list" | "teams" | "create";

function UserSearchModal({
  open,
  excludeIds,
  onSelect,
  onClose,
}: {
  open: boolean;
  excludeIds: Set<number>;
  onSelect: (user: UserResult) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserResult[]>([]);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  function handleQueryChange(value: string) {
    setQuery(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!value.trim()) { setResults([]); return; }
    timerRef.current = setTimeout(async () => {
      setSearching(true);
      const data = await searchUsers(value);
      setResults(data.filter((u) => !excludeIds.has(u.id)));
      setSearching(false);
    }, 300);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-[#ebeef0] bg-white shadow-[0_8px_40px_rgba(0,0,0,0.14)]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[#ebeef0] px-5 py-4">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-teal-500" strokeWidth={2} />
            <span className="text-[15px] font-semibold text-slate-800">유저 검색</span>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-300 hover:bg-slate-100 hover:text-slate-500">
            <X className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </div>
        <div className="px-5 py-3">
          <div className="flex items-center gap-2.5 rounded-xl border border-[#ebeef0] bg-slate-50 px-3.5 py-2.5 focus-within:border-teal-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-teal-100">
            <Search className="h-4 w-4 shrink-0 text-slate-300" strokeWidth={2} />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder="닉네임 또는 이메일로 검색"
              className="flex-1 bg-transparent text-[14px] text-slate-800 outline-none placeholder:text-slate-300"
            />
            {query && (
              <button onClick={() => { setQuery(""); setResults([]); }} className="text-slate-300 hover:text-slate-500">
                <X className="h-3.5 w-3.5" strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>
        <div className="max-h-72 overflow-y-auto px-2 pb-3">
          {searching ? (
            <div className="flex justify-center py-10 text-[13px] text-slate-300">검색 중...</div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-slate-300">
              <User className="h-8 w-8" strokeWidth={1.5} />
              <p className="text-[13.5px]">{query ? "검색 결과가 없습니다." : "검색어를 입력하세요."}</p>
            </div>
          ) : (
            results.map((u) => (
              <button
                key={u.id}
                onClick={() => onSelect(u)}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-teal-50"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100">
                  <User className="h-4 w-4 text-slate-400" strokeWidth={2} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-semibold text-slate-800">{u.name}</p>
                  <p className="text-[12px] text-slate-400">{u.email}</p>
                </div>
                <span className="shrink-0 text-[11.5px] text-slate-300">{u.joinedAt} 가입</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function TeamSearchModal({
  open,
  teams,
  onSelect,
  onClose,
}: {
  open: boolean;
  teams: Team[];
  onSelect: (team: Team) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) { setQuery(""); setTimeout(() => inputRef.current?.focus(), 50); }
  }, [open]);

  if (!open) return null;
  const filtered = teams.filter((t) => t.name.includes(query));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-[#ebeef0] bg-white shadow-[0_8px_40px_rgba(0,0,0,0.14)]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[#ebeef0] px-5 py-4">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-teal-500" strokeWidth={2} />
            <span className="text-[15px] font-semibold text-slate-800">팀 검색</span>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-300 hover:bg-slate-100 hover:text-slate-500">
            <X className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </div>
        <div className="px-5 py-3">
          <div className="flex items-center gap-2.5 rounded-xl border border-[#ebeef0] bg-slate-50 px-3.5 py-2.5 focus-within:border-teal-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-teal-100">
            <Search className="h-4 w-4 shrink-0 text-slate-300" strokeWidth={2} />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="팀 이름으로 검색"
              className="flex-1 bg-transparent text-[14px] text-slate-800 outline-none placeholder:text-slate-300"
            />
            {query && (
              <button onClick={() => setQuery("")} className="text-slate-300 hover:text-slate-500">
                <X className="h-3.5 w-3.5" strokeWidth={2.5} />
              </button>
            )}
          </div>
        </div>
        <div className="max-h-72 overflow-y-auto px-2 pb-3">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-slate-300">
              <Users className="h-8 w-8" strokeWidth={1.5} />
              <p className="text-[13.5px]">{query ? "검색 결과가 없습니다." : teams.length === 0 ? "등록된 팀이 없습니다." : "검색어를 입력하세요."}</p>
            </div>
          ) : (
            filtered.map((t) => (
              <button
                key={t.id}
                onClick={() => onSelect(t)}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-teal-50"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100">
                  <Users className="h-4 w-4 text-slate-400" strokeWidth={2} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-semibold text-slate-800">{t.name}</p>
                  <p className="text-[12px] text-slate-400">{t.createdAt} 생성</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export function PermissionsClient({
  initialAdmins,
  initialTeams,
  isSuperAdmin,
}: {
  initialAdmins: AdminAccount[];
  initialTeams: Team[];
  isSuperAdmin: boolean;
}) {
  const [admins, setAdmins] = useState<AdminAccount[]>(initialAdmins);
  const [teams, setTeams] = useState<Team[]>(initialTeams);
  const [tab, setTab] = useState<Tab>("list");
  const [isPending, startTransition] = useTransition();

  const [pendingDelAdminId, setPendingDelAdminId] = useState<number | null>(null);
  const [pendingRoleChangeId, setPendingRoleChangeId] = useState<number | null>(null);
  const [pendingDelTeamId, setPendingDelTeamId] = useState<number | null>(null);
  const [pendingExcludeId, setPendingExcludeId] = useState<number | null>(null);

  const [selectedTeamDetail, setSelectedTeamDetail] = useState<Team | null>(null);
  const [draggingAdminId, setDraggingAdminId] = useState<number | null>(null);
  const [dragOverTeamId, setDragOverTeamId] = useState<number | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const [addingTeam, setAddingTeam] = useState(false);
  const [teamNameInput, setTeamNameInput] = useState("");
  const teamInputRef = useRef<HTMLInputElement>(null);

  const [selectedUser, setSelectedUser] = useState<UserResult | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [teamModalOpen, setTeamModalOpen] = useState(false);

  const adminIds = new Set<number>(admins.map((a) => a.id));
  const superAdmins = admins.filter((a) => a.role === "super_admin");
  const unassigned = admins.filter((a) => a.role === "admin" && a.teamId === null);

  function handleDeleteAdmin(id: number) {
    startTransition(async () => {
      await revokeAdmin(id);
      setAdmins((prev) => prev.filter((a) => a.id !== id));
      setPendingDelAdminId(null);
    });
  }

  function handleCreate() {
    if (!selectedUser) return;
    startTransition(async () => {
      await promoteToAdmin(selectedUser.id, selectedTeam?.id ?? null);
      const now = new Date().toISOString().slice(0, 10);
      setAdmins((prev) => [
        ...prev,
        {
          id: selectedUser.id,
          name: selectedUser.name,
          email: selectedUser.email,
          role: "admin",
          teamId: selectedTeam?.id ?? null,
          createdAt: now,
        },
      ]);
      setSelectedUser(null);
      setSelectedTeam(null);
      setTab("list");
    });
  }

  function handleAddTeam() {
    const name = teamNameInput.trim();
    if (!name) return;
    startTransition(async () => {
      const newTeam = await createTeam(name);
      if (newTeam) setTeams((prev) => [...prev, newTeam]);
      setTeamNameInput("");
      setAddingTeam(false);
    });
  }

  function handleDeleteTeam(id: number) {
    startTransition(async () => {
      await deleteTeam(id);
      setTeams((prev) => prev.filter((t) => t.id !== id));
      setAdmins((prev) => prev.map((a) => (a.teamId === id ? { ...a, teamId: null } : a)));
      setPendingDelTeamId(null);
    });
  }

  function handleRemoveFromTeam(adminId: number) {
    startTransition(async () => {
      await assignTeam(adminId, null);
      setAdmins((prev) => prev.map((a) => (a.id === adminId ? { ...a, teamId: null } : a)));
      setPendingExcludeId(null);
    });
  }

  function toggleTeamPermission(teamId: number, perm: AdminPermission) {
    const team = teams.find((t) => t.id === teamId);
    if (!team) return;
    const newPerms = team.permissions.includes(perm)
      ? team.permissions.filter((p) => p !== perm)
      : [...team.permissions, perm];

    startTransition(async () => {
      await setTeamPermissions(teamId, newPerms);
    });

    setTeams((prev) =>
      prev.map((t) => (t.id === teamId ? { ...t, permissions: newPerms } : t)),
    );
    setSelectedTeamDetail((prev) =>
      prev?.id === teamId ? { ...prev, permissions: newPerms } : prev,
    );
  }

  function AdminRow({ admin, isLast }: { admin: AdminAccount; isLast: boolean }) {
    const isSuperAdmin = admin.role === "super_admin";
    const team = teams.find((t) => t.id === admin.teamId);
    return (
      <tr className={["transition-colors hover:bg-slate-50", !isLast ? "border-b border-[#ebeef0]" : ""].join(" ")}>
        <td className="px-5 py-4">
          <div className="flex items-center gap-3">
            <div className={["flex h-8 w-8 shrink-0 items-center justify-center rounded-full", isSuperAdmin ? "bg-amber-100" : "bg-teal-50"].join(" ")}>
              {isSuperAdmin ? <Crown className="h-4 w-4 text-amber-500" strokeWidth={2} /> : <ShieldCheck className="h-4 w-4 text-teal-500" strokeWidth={2} />}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-slate-800">{admin.name}</p>
              <p className="truncate text-[12px] text-slate-400">{admin.email}</p>
            </div>
          </div>
        </td>
        <td className="px-5 py-4">
          {isSuperAdmin ? (
            <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[12px] font-semibold text-amber-600">전체 권한</span>
          ) : team ? (
            <span className="rounded-full border border-teal-200 bg-teal-50 px-2.5 py-0.5 text-[12px] font-semibold text-teal-600">{team.name}</span>
          ) : (
            <span className="text-[12px] text-slate-300">미배정</span>
          )}
        </td>
        <td className="whitespace-nowrap px-5 py-4 text-slate-500">{admin.createdAt}</td>
        <td className="px-5 py-4">
          {!isSuperAdmin && (
            pendingRoleChangeId === admin.id ? (
              <div className="flex items-center justify-end gap-1">
                <span className="text-[12px] text-slate-500">슈퍼어드민으로 승격?</span>
                <button onClick={() => {
                  startTransition(async () => {
                    await setAdminRole(admin.id, "super_admin");
                    setAdmins((prev) => prev.map((a) => a.id === admin.id ? { ...a, role: "super_admin" } : a));
                    setPendingRoleChangeId(null);
                  });
                }} disabled={isPending} className="rounded-lg px-2.5 py-1.5 text-[12px] font-semibold text-amber-500 hover:bg-amber-50 disabled:opacity-50">확인</button>
                <button onClick={() => setPendingRoleChangeId(null)} className="rounded-lg p-1.5 text-slate-300 hover:bg-slate-100 hover:text-slate-500"><X className="h-3.5 w-3.5" strokeWidth={2.5} /></button>
              </div>
            ) : pendingDelAdminId === admin.id ? (
              <div className="flex items-center justify-end gap-1">
                <button onClick={() => handleDeleteAdmin(admin.id)} disabled={isPending} className="rounded-lg px-2.5 py-1.5 text-[12px] font-semibold text-red-500 hover:bg-red-50 disabled:opacity-50">삭제</button>
                <button onClick={() => setPendingDelAdminId(null)} className="rounded-lg p-1.5 text-slate-300 hover:bg-slate-100 hover:text-slate-500"><X className="h-3.5 w-3.5" strokeWidth={2.5} /></button>
              </div>
            ) : (
              <div className="flex items-center justify-end gap-1">
                <button onClick={() => setPendingRoleChangeId(admin.id)} className="rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-slate-400 hover:bg-amber-50 hover:text-amber-500 border border-[#ebeef0]">승격</button>
                <button onClick={() => setPendingDelAdminId(admin.id)} className="rounded-lg p-1.5 text-slate-300 hover:bg-red-50 hover:text-red-400"><Trash2 className="h-4 w-4" strokeWidth={2} /></button>
              </div>
            )
          )}
        </td>
      </tr>
    );
  }

  function toggleGroup(key: string) {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  function GroupHeader({ label, count, groupKey, collapsible = false }: { label: string; count: number; groupKey: string; collapsible?: boolean }) {
    const collapsed = !expandedGroups.has(groupKey);
    return (
      <tr
        onClick={collapsible ? () => toggleGroup(groupKey) : undefined}
        className={collapsible ? "cursor-pointer select-none" : ""}
      >
        <td colSpan={4} className="border-b border-[#ebeef0] bg-slate-50 px-5 py-3.5 hover:bg-slate-100 transition-colors">
          <div className="flex items-center gap-2">
            {collapsible && (
              <ChevronRight
                className={["h-3.5 w-3.5 text-slate-400 transition-transform duration-200", collapsed ? "" : "rotate-90"].join(" ")}
                strokeWidth={2.5}
              />
            )}
            <span className="text-[12px] font-semibold text-slate-500">{label}</span>
            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-500">{count}</span>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <>
      {!isSuperAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="relative flex w-full max-w-sm flex-col items-center gap-4 rounded-2xl border border-[#ebeef0] bg-white p-8 text-center shadow-[0_8px_40px_rgba(0,0,0,0.14)]">
            <button
              onClick={() => window.history.back()}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-300 hover:bg-slate-100 hover:text-slate-500"
            >
              <X className="h-4 w-4" strokeWidth={2.5} />
            </button>
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-50">
              <ShieldAlert className="h-7 w-7 text-amber-500" strokeWidth={1.8} />
            </div>
            <div>
              <p className="text-[17px] font-bold text-slate-900">슈퍼어드민 전용입니다</p>
              <p className="mt-1.5 text-[13.5px] text-slate-400">이 페이지는 슈퍼어드민만 접근할 수 있습니다.</p>
            </div>
          </div>
        </div>
      )}
      <UserSearchModal
        open={userModalOpen}
        excludeIds={adminIds}
        onSelect={(u) => { setSelectedUser(u); setUserModalOpen(false); }}
        onClose={() => setUserModalOpen(false)}
      />
      <TeamSearchModal
        open={teamModalOpen}
        teams={teams}
        onSelect={(t) => { setSelectedTeam(t); setTeamModalOpen(false); }}
        onClose={() => setTeamModalOpen(false)}
      />

      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-7">
          <Link href="/admin/operation" className="mb-2 flex items-center gap-1 text-[13px] text-slate-400 hover:text-slate-600">
            <ChevronLeft className="h-3.5 w-3.5" strokeWidth={2.5} />
            운영 관리
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50">
              <KeyRound className="h-5 w-5 text-teal-600" strokeWidth={2} />
            </div>
            <h1 className="text-[24px] font-bold text-slate-900">권한 관리</h1>
          </div>
          <p className="mt-1 text-[13px] text-slate-500">팀 단위로 권한을 설정하고 어드민 계정을 관리합니다. 슈퍼어드민 전용 페이지입니다.</p>
        </div>

        {/* Tab bar */}
        <div className="mb-5">
          <div className="flex w-fit gap-1 rounded-xl border border-[#ebeef0] bg-slate-50 p-1">
            {([
              { key: "list",   label: "어드민 목록", icon: null },
              { key: "teams",  label: "팀 목록",     icon: null },
              { key: "create", label: "어드민 추가", icon: <UserPlus className="h-3.5 w-3.5" strokeWidth={2.5} /> },
            ] as const).map(({ key, label, icon }) => (
              <button
                key={key}
                onClick={() => { setTab(key); setSelectedTeamDetail(null); }}
                className={["flex cursor-pointer items-center gap-1.5 rounded-lg px-4 py-2 text-[13.5px] font-semibold transition-colors", tab === key ? "bg-white text-slate-800 shadow-sm" : "text-slate-400 hover:text-slate-600"].join(" ")}
              >
                {icon}{label}
              </button>
            ))}
          </div>
        </div>

        {/* ── 어드민 목록 ── */}
        {tab === "list" && (
          <div className="rounded-2xl border border-[#ebeef0] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
            <table className="w-full text-[13.5px]">
              <thead>
                <tr className="border-b border-[#ebeef0] text-left text-[12px] font-semibold uppercase tracking-wide text-slate-400">
                  <th className="min-w-45 px-5 py-3.5">계정</th>
                  <th className="px-5 py-3.5">소속 팀 / 권한</th>
                  <th className="whitespace-nowrap px-5 py-3.5">추가일</th>
                  <th className="px-5 py-3.5" />
                </tr>
              </thead>
              <tbody>
                {superAdmins.length > 0 && (
                  <>
                    <GroupHeader label="슈퍼어드민" count={superAdmins.length} groupKey="super_admin" collapsible />
                    {!!expandedGroups.has("super_admin") && superAdmins.map((a, i) => <AdminRow key={a.id} admin={a} isLast={i === superAdmins.length - 1 && teams.length === 0 && unassigned.length === 0} />)}
                  </>
                )}
                {teams.map((team) => {
                  const members = admins.filter((a) => a.teamId === team.id);
                  const gKey = `team-${team.id}`;
                  const collapsed = !expandedGroups.has(gKey);
                  return (
                    <React.Fragment key={team.id}>
                      <GroupHeader label={team.name} count={members.length} groupKey={gKey} collapsible />
                      {!collapsed && (members.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="border-b border-[#ebeef0] px-5 py-5 text-center text-[13px] text-slate-300">소속 어드민이 없습니다.</td>
                        </tr>
                      ) : (
                        members.map((a, i) => <AdminRow key={a.id} admin={a} isLast={i === members.length - 1} />)
                      ))}
                    </React.Fragment>
                  );
                })}
                {unassigned.length > 0 && (
                  <>
                    <GroupHeader label="미배정" count={unassigned.length} groupKey="unassigned" collapsible />
                    {!!expandedGroups.has("unassigned") && unassigned.map((a, i) => <AdminRow key={a.id} admin={a} isLast={i === unassigned.length - 1} />)}
                  </>
                )}
                {admins.length === 0 && (
                  <tr><td colSpan={4} className="py-16 text-center text-[13px] text-slate-300">등록된 어드민이 없습니다.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* ── 팀 목록 ── */}
        {tab === "teams" && (
          selectedTeamDetail ? (
            (() => {
              const members = admins.filter((a) => a.teamId === selectedTeamDetail.id);
              return (
                <div className="flex flex-col gap-5">
                  <button onClick={() => { setSelectedTeamDetail(null); setPendingExcludeId(null); }} className="flex w-fit items-center gap-1 text-[13px] text-slate-400 hover:text-slate-600">
                    <ChevronLeft className="h-3.5 w-3.5" strokeWidth={2.5} />팀 목록
                  </button>
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50">
                      <Users className="h-5 w-5 text-teal-600" strokeWidth={2} />
                    </div>
                    <div>
                      <h2 className="text-[18px] font-bold text-slate-900">{selectedTeamDetail.name}</h2>
                      <p className="text-[12.5px] text-slate-400">멤버 {members.length}명 · {selectedTeamDetail.createdAt} 생성</p>
                    </div>
                  </div>

                  {/* 팀 권한 */}
                  <div className="rounded-2xl border border-[#ebeef0] bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
                    <p className="mb-4 text-[14px] font-semibold text-slate-800">팀 권한</p>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {PERMISSIONS.map((p) => {
                        const active = selectedTeamDetail.permissions.includes(p.key);
                        return (
                          <button
                            key={p.key}
                            type="button"
                            onClick={() => toggleTeamPermission(selectedTeamDetail.id, p.key)}
                            disabled={isPending}
                            className={["flex items-start gap-3 rounded-xl border px-4 py-3 text-left transition-colors disabled:opacity-60", active ? "border-teal-400 bg-teal-50" : "border-[#ebeef0] hover:bg-slate-50"].join(" ")}
                          >
                            <span className={["mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors", active ? "border-teal-400 bg-teal-500" : "border-[#dde1e4] bg-white"].join(" ")}>
                              {active && <Check className="h-3 w-3 text-white" strokeWidth={2.5} />}
                            </span>
                            <span className="min-w-0">
                              <span className={["block text-[13px] font-semibold", active ? "text-teal-700" : "text-slate-700"].join(" ")}>{p.label}</span>
                              <span className="mt-0.5 block text-[11.5px] text-slate-400">{p.description}</span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 멤버 */}
                  <div className="rounded-2xl border border-[#ebeef0] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
                    <div className="border-b border-[#ebeef0] px-5 py-3.5">
                      <p className="text-[14px] font-semibold text-slate-800">멤버</p>
                    </div>
                    {members.length === 0 ? (
                      <div className="flex flex-col items-center justify-center gap-2 py-16 text-slate-300">
                        <Users className="h-10 w-10" strokeWidth={1.5} />
                        <p className="text-[14px]">소속 멤버가 없습니다.</p>
                      </div>
                    ) : (
                      <table className="w-full text-[13.5px]">
                        <thead>
                          <tr className="border-b border-[#ebeef0] text-left text-[12px] font-semibold uppercase tracking-wide text-slate-400">
                            <th className="px-5 py-3.5">계정</th>
                            <th className="whitespace-nowrap px-5 py-3.5">추가일</th>
                            <th className="px-5 py-3.5" />
                          </tr>
                        </thead>
                        <tbody>
                          {members.map((member, i) => (
                            <tr key={member.id} className={["transition-colors hover:bg-slate-50", i !== members.length - 1 ? "border-b border-[#ebeef0]" : ""].join(" ")}>
                              <td className="px-5 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-50">
                                    <ShieldCheck className="h-4 w-4 text-teal-500" strokeWidth={2} />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-semibold text-slate-800">{member.name}</p>
                                    <p className="truncate text-[12px] text-slate-400">{member.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="whitespace-nowrap px-5 py-4 text-slate-500">{member.createdAt}</td>
                              <td className="px-5 py-4">
                                {pendingExcludeId === member.id ? (
                                  <div className="flex items-center justify-end gap-1">
                                    <button onClick={() => handleRemoveFromTeam(member.id)} disabled={isPending} className="rounded-lg px-2.5 py-1.5 text-[12px] font-semibold text-red-500 hover:bg-red-50 disabled:opacity-50">제외</button>
                                    <button onClick={() => setPendingExcludeId(null)} className="rounded-lg p-1.5 text-slate-300 hover:bg-slate-100 hover:text-slate-500"><X className="h-3.5 w-3.5" strokeWidth={2.5} /></button>
                                  </div>
                                ) : (
                                  <div className="flex justify-end">
                                    <button onClick={() => setPendingExcludeId(member.id)} className="rounded-lg border border-[#ebeef0] px-3 py-1.5 text-[12px] font-medium text-slate-400 hover:border-red-200 hover:bg-red-50 hover:text-red-400">팀에서 제외</button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              );
            })()
          ) : (
            <div className="flex flex-col gap-4">
              <div className="rounded-2xl border border-[#ebeef0] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
                {teams.length === 0 && !addingTeam ? (
                  <div className="flex flex-col items-center justify-center gap-2 py-20 text-slate-300">
                    <FolderOpen className="h-10 w-10" strokeWidth={1.5} />
                    <p className="text-[14px]">등록된 팀이 없습니다.</p>
                  </div>
                ) : (
                  <table className="w-full text-[13.5px]">
                    <thead>
                      <tr className="border-b border-[#ebeef0] text-left text-[12px] font-semibold uppercase tracking-wide text-slate-400">
                        <th className="px-5 py-3.5">팀 이름</th>
                        <th className="px-5 py-3.5">권한</th>
                        <th className="px-5 py-3.5 text-center">멤버</th>
                        <th className="whitespace-nowrap px-5 py-3.5">생성일</th>
                        <th className="px-5 py-3.5" />
                      </tr>
                    </thead>
                    <tbody>
                      {teams.map((team, i) => {
                        const count = admins.filter((a) => a.teamId === team.id).length;
                        const isLast = i === teams.length - 1 && !addingTeam;
                        const isDragTarget = draggingAdminId !== null && dragOverTeamId === team.id;
                        return (
                          <tr
                            key={team.id}
                            onClick={() => { if (!draggingAdminId) setSelectedTeamDetail(team); }}
                            onDragOver={(e) => { e.preventDefault(); setDragOverTeamId(team.id); }}
                            onDragLeave={() => setDragOverTeamId(null)}
                            onDrop={(e) => {
                              e.preventDefault();
                              setDragOverTeamId(null);
                              if (draggingAdminId === null) return;
                              const adminId = draggingAdminId;
                              setDraggingAdminId(null);
                              startTransition(async () => {
                                await assignTeam(adminId, team.id);
                                setAdmins((prev) => prev.map((a) => (a.id === adminId ? { ...a, teamId: team.id } : a)));
                              });
                            }}
                            className={["transition-colors", !isLast ? "border-b border-[#ebeef0]" : "", isDragTarget ? "bg-teal-100 outline outline-2 outline-teal-400" : draggingAdminId ? "hover:bg-teal-50 cursor-copy" : "cursor-pointer hover:bg-teal-50"].join(" ")}
                          >
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2.5">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50">
                                  <Users className="h-4 w-4 text-teal-500" strokeWidth={2} />
                                </div>
                                <span className="font-semibold text-slate-800">{team.name}</span>
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex flex-wrap gap-1">
                                {team.permissions.length === 0 ? (
                                  <span className="text-[12px] text-slate-300">없음</span>
                                ) : (
                                  team.permissions.map((perm) => {
                                    const p = PERMISSIONS.find((x) => x.key === perm)!;
                                    return <span key={perm} className="rounded-full border border-teal-200 bg-teal-50 px-2 py-0.5 text-[11.5px] font-medium text-teal-600">{p.label}</span>;
                                  })
                                )}
                              </div>
                            </td>
                            <td className="px-5 py-4 text-center">
                              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[12px] font-semibold text-slate-600">{count}명</span>
                            </td>
                            <td className="whitespace-nowrap px-5 py-4 text-slate-500">{team.createdAt}</td>
                            <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                              {pendingDelTeamId === team.id ? (
                                <div className="flex items-center justify-end gap-1">
                                  <button onClick={() => handleDeleteTeam(team.id)} disabled={isPending} className="rounded-lg px-2.5 py-1.5 text-[12px] font-semibold text-red-500 hover:bg-red-50 disabled:opacity-50">삭제</button>
                                  <button onClick={() => setPendingDelTeamId(null)} className="rounded-lg p-1.5 text-slate-300 hover:bg-slate-100 hover:text-slate-500"><X className="h-3.5 w-3.5" strokeWidth={2.5} /></button>
                                </div>
                              ) : (
                                <div className="flex items-center justify-end gap-2">
                                  <ChevronRight className="h-4 w-4 text-slate-300" strokeWidth={2} />
                                  <button onClick={() => setPendingDelTeamId(team.id)} className="rounded-lg p-1.5 text-slate-300 hover:bg-red-50 hover:text-red-400"><Trash2 className="h-4 w-4" strokeWidth={2} /></button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      {addingTeam && (
                        <tr className={teams.length > 0 ? "border-t border-[#ebeef0]" : ""}>
                          <td className="px-5 py-3" colSpan={5}>
                            <div className="flex items-center gap-2">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-50">
                                <Users className="h-4 w-4 text-teal-400" strokeWidth={2} />
                              </div>
                              <input
                                ref={teamInputRef}
                                value={teamNameInput}
                                onChange={(e) => setTeamNameInput(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleAddTeam();
                                  if (e.key === "Escape") { setAddingTeam(false); setTeamNameInput(""); }
                                }}
                                placeholder="팀 이름 입력"
                                className="flex-1 rounded-lg border border-teal-300 bg-teal-50 px-3 py-1.5 text-[13.5px] text-slate-800 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                              />
                              <button onClick={handleAddTeam} disabled={!teamNameInput.trim() || isPending} className="rounded-lg bg-teal-500 px-4 py-1.5 text-[13px] font-semibold text-white hover:bg-teal-600 disabled:opacity-40">추가</button>
                              <button onClick={() => { setAddingTeam(false); setTeamNameInput(""); }} className="rounded-lg p-1.5 text-slate-300 hover:bg-slate-100 hover:text-slate-500"><X className="h-4 w-4" strokeWidth={2.5} /></button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
              {!addingTeam && (
                <button
                  onClick={() => { setAddingTeam(true); setTimeout(() => teamInputRef.current?.focus(), 50); }}
                  className="flex w-fit items-center gap-1.5 rounded-xl border border-dashed border-[#c8cdd2] px-4 py-2.5 text-[13px] text-slate-400 transition-colors hover:border-teal-400 hover:bg-teal-50 hover:text-teal-500"
                >
                  <Plus className="h-4 w-4" strokeWidth={2} />새 팀 추가
                </button>
              )}

              {/* 미배정 어드민 드래그 영역 */}
              {unassigned.length > 0 && (
                <div className="rounded-2xl border border-dashed border-[#c8cdd2] bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
                  <p className="mb-3 text-[13px] font-semibold text-slate-500">
                    미배정 어드민
                    <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">{unassigned.length}명</span>
                    {draggingAdminId === null && (
                      <span className="ml-2 text-[12px] font-normal text-slate-300">팀 행으로 드래그하여 배정</span>
                    )}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {unassigned.map((admin) => (
                      <div
                        key={admin.id}
                        draggable
                        onDragStart={() => setDraggingAdminId(admin.id)}
                        onDragEnd={() => { setDraggingAdminId(null); setDragOverTeamId(null); }}
                        className={[
                          "flex cursor-grab items-center gap-2 rounded-xl border px-3 py-2 text-[13px] select-none active:cursor-grabbing",
                          draggingAdminId === admin.id
                            ? "border-teal-400 bg-teal-50 opacity-50"
                            : "border-[#ebeef0] bg-slate-50 hover:border-teal-300 hover:bg-teal-50",
                        ].join(" ")}
                      >
                        <ShieldCheck className="h-3.5 w-3.5 text-teal-400" strokeWidth={2} />
                        <span className="font-medium text-slate-700">{admin.name}</span>
                        <span className="text-[11px] text-slate-400">{admin.email}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        )}

        {/* ── 어드민 추가 ── */}
        {tab === "create" && (
          <div className="rounded-2xl border border-[#ebeef0] bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
            <p className="mb-5 text-[15px] font-semibold text-slate-800">새 어드민 계정 추가</p>
            <div className="flex flex-col gap-5">
              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-slate-600">대상 유저</label>
                {selectedUser ? (
                  <div className="flex items-center gap-3 rounded-xl border border-teal-300 bg-teal-50 px-4 py-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-100">
                      <User className="h-4 w-4 text-teal-500" strokeWidth={2} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13.5px] font-semibold text-slate-800">{selectedUser.name}</p>
                      <p className="text-[12px] text-slate-500">{selectedUser.email}</p>
                    </div>
                    <button onClick={() => setSelectedUser(null)} className="rounded-lg p-1.5 text-slate-300 hover:bg-teal-100 hover:text-slate-500"><X className="h-4 w-4" strokeWidth={2.5} /></button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setUserModalOpen(true)}
                    className="flex w-full items-center gap-2.5 rounded-xl border border-dashed border-[#c8cdd2] px-4 py-3 text-left text-slate-400 transition-colors hover:border-teal-400 hover:bg-teal-50 hover:text-teal-500"
                  >
                    <Search className="h-4 w-4 shrink-0" strokeWidth={2} />
                    <span className="text-[13.5px]">유저 검색으로 선택하기</span>
                  </button>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-slate-600">
                  소속 팀 <span className="ml-1.5 font-normal text-slate-400">(선택 · 팀 권한이 자동 적용됩니다)</span>
                </label>
                {selectedTeam ? (
                  <div className="flex items-center gap-3 rounded-xl border border-teal-300 bg-teal-50 px-4 py-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-100">
                      <Users className="h-4 w-4 text-teal-500" strokeWidth={2} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13.5px] font-semibold text-slate-800">{selectedTeam.name}</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {selectedTeam.permissions.length === 0 ? (
                          <span className="text-[12px] text-slate-400">부여된 권한 없음</span>
                        ) : (
                          selectedTeam.permissions.map((perm) => {
                            const p = PERMISSIONS.find((x) => x.key === perm)!;
                            return <span key={perm} className="rounded-full border border-teal-200 bg-teal-100 px-2 py-0.5 text-[11px] font-medium text-teal-600">{p.label}</span>;
                          })
                        )}
                      </div>
                    </div>
                    <button onClick={() => setSelectedTeam(null)} className="rounded-lg p-1.5 text-slate-300 hover:bg-teal-100 hover:text-slate-500"><X className="h-4 w-4" strokeWidth={2.5} /></button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setTeamModalOpen(true)}
                    className="flex w-full items-center gap-2.5 rounded-xl border border-dashed border-[#c8cdd2] px-4 py-3 text-left text-slate-400 transition-colors hover:border-teal-400 hover:bg-teal-50 hover:text-teal-500"
                  >
                    <Search className="h-4 w-4 shrink-0" strokeWidth={2} />
                    <span className="text-[13.5px]">팀 검색으로 선택하기</span>
                  </button>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => { setSelectedUser(null); setSelectedTeam(null); setTab("list"); }}
                  className="rounded-xl border border-[#ebeef0] px-4 py-2 text-[13.5px] font-medium text-slate-500 hover:bg-slate-50"
                >
                  취소
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!selectedUser || isPending}
                  className="rounded-xl bg-teal-500 px-5 py-2 text-[13.5px] font-semibold text-white hover:bg-teal-600 disabled:opacity-40"
                >
                  {isPending ? "처리 중..." : "추가"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
