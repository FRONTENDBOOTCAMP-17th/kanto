"use client";

import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Search, X, User, Users } from "lucide-react";
import type { AdminAccount, Team, UserResult } from "../actions";
import { searchUsers, promoteToAdmin } from "../actions";
import { PERMISSIONS } from "./constants";

function UserSearchModal({
  excludeIds,
  onSelect,
  onClose,
}: {
  excludeIds: Set<number>;
  onSelect: (user: UserResult) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const { data: allResults = [], isFetching } = useQuery({
    queryKey: ["users", "search", debouncedQuery],
    queryFn: () => searchUsers(debouncedQuery),
    enabled: debouncedQuery.trim().length > 0,
    staleTime: 30_000,
  });

  const results = allResults.filter((u) => !excludeIds.has(u.id));

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
              onChange={(e) => setQuery(e.target.value)}
              placeholder="닉네임 또는 이메일로 검색"
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
          {isFetching ? (
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
  teams,
  onSelect,
  onClose,
}: {
  teams: Team[];
  onSelect: (team: Team) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

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

interface Props {
  teams: Team[];
  adminIds: Set<number>;
  onAdminCreated: (admin: AdminAccount) => void;
  onCancel: () => void;
}

export function CreateAdminTab({ teams, adminIds, onAdminCreated, onCancel }: Props) {
  const [selectedUser, setSelectedUser] = useState<UserResult | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [teamModalOpen, setTeamModalOpen] = useState(false);

  const createMutation = useMutation({
    mutationFn: ({ userId, teamId }: { userId: number; teamId: number | null }) =>
      promoteToAdmin(userId, teamId),
    onSuccess: () => {
      if (!selectedUser) return;
      onAdminCreated({
        id: selectedUser.id,
        name: selectedUser.name,
        email: selectedUser.email,
        role: "admin",
        teamId: selectedTeam?.id ?? null,
        createdAt: new Date().toISOString().slice(0, 10),
      });
      setSelectedUser(null);
      setSelectedTeam(null);
    },
  });

  return (
    <>
      {userModalOpen && (
        <UserSearchModal
          excludeIds={adminIds}
          onSelect={(u) => { setSelectedUser(u); setUserModalOpen(false); }}
          onClose={() => setUserModalOpen(false)}
        />
      )}
      {teamModalOpen && (
        <TeamSearchModal
          teams={teams}
          onSelect={(t) => { setSelectedTeam(t); setTeamModalOpen(false); }}
          onClose={() => setTeamModalOpen(false)}
        />
      )}

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
                <button onClick={() => setSelectedUser(null)} className="rounded-lg p-1.5 text-slate-300 hover:bg-teal-100 hover:text-slate-500">
                  <X className="h-4 w-4" strokeWidth={2.5} />
                </button>
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
                        return (
                          <span key={perm} className="rounded-full border border-teal-200 bg-teal-100 px-2 py-0.5 text-[11px] font-medium text-teal-600">
                            {p.label}
                          </span>
                        );
                      })
                    )}
                  </div>
                </div>
                <button onClick={() => setSelectedTeam(null)} className="rounded-lg p-1.5 text-slate-300 hover:bg-teal-100 hover:text-slate-500">
                  <X className="h-4 w-4" strokeWidth={2.5} />
                </button>
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
              onClick={onCancel}
              className="rounded-xl border border-[#ebeef0] px-4 py-2 text-[13.5px] font-medium text-slate-500 hover:bg-slate-50"
            >취소</button>
            <button
              onClick={() => selectedUser && createMutation.mutate({ userId: selectedUser.id, teamId: selectedTeam?.id ?? null })}
              disabled={!selectedUser || createMutation.isPending}
              className="rounded-xl bg-teal-500 px-5 py-2 text-[13.5px] font-semibold text-white hover:bg-teal-600 disabled:opacity-40"
            >
              {createMutation.isPending ? "처리 중..." : "추가"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
