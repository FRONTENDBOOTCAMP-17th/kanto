"use client";

import { ChevronRight, Users, Trash2, X, Plus, FolderOpen, ShieldCheck } from "lucide-react";
import type { AdminAccount, Team } from "../../actions";
import { PERMISSIONS } from "../constants";
import { useTeamListView } from "./useTeamListView";

interface Props {
  teams: Team[];
  admins: AdminAccount[];
  onSelectTeam: (team: Team) => void;
  onTeamCreated: (team: Team) => void;
  onTeamDeleted: (id: number) => void;
  onAdminAssigned: (adminId: number, teamId: number) => void;
}

export function TeamListView({
  teams, admins, onSelectTeam,
  onTeamCreated, onTeamDeleted, onAdminAssigned,
}: Props) {
  const {
    draggingAdminId, setDraggingAdminId,
    dragOverTeamId, setDragOverTeamId,
    addingTeam, setAddingTeam,
    teamNameInput, setTeamNameInput,
    pendingDelTeamId, setPendingDelTeamId,
    teamInputRef,
    isPending, unassigned,
    onCreateTeam, onDeleteTeam, onAssignAdmin,
  } = useTeamListView({ admins, onTeamCreated, onTeamDeleted, onAdminAssigned });

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-x-auto rounded-2xl border border-[#ebeef0] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
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
                <th className="hidden px-5 py-3.5 lg:table-cell">권한</th>
                <th className="px-5 py-3.5 text-center">멤버</th>
                <th className="hidden whitespace-nowrap px-5 py-3.5 md:table-cell">생성일</th>
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
                    onClick={() => { if (!draggingAdminId) onSelectTeam(team); }}
                    onDragOver={(e) => { e.preventDefault(); setDragOverTeamId(team.id); }}
                    onDragLeave={() => setDragOverTeamId(null)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOverTeamId(null);
                      if (draggingAdminId === null) return;
                      const adminId = draggingAdminId;
                      setDraggingAdminId(null);
                      onAssignAdmin(adminId, team.id);
                    }}
                    className={[
                      "transition-colors",
                      !isLast ? "border-b border-[#ebeef0]" : "",
                      isDragTarget ? "bg-teal-100 outline outline-2 outline-teal-400" : draggingAdminId ? "cursor-copy hover:bg-teal-50" : "cursor-pointer hover:bg-teal-50",
                    ].join(" ")}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50">
                          <Users className="h-4 w-4 text-teal-500" strokeWidth={2} />
                        </div>
                        <span className="font-semibold text-slate-800">{team.name}</span>
                      </div>
                    </td>
                    <td className="hidden px-5 py-4 lg:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {team.permissions.length === 0 ? (
                          <span className="text-[12px] text-slate-300">없음</span>
                        ) : (
                          team.permissions.map((perm) => {
                            const p = PERMISSIONS.find((x) => x.key === perm)!;
                            return (
                              <span key={perm} className="rounded-full border border-teal-200 bg-teal-50 px-2 py-0.5 text-[11.5px] font-medium text-teal-600">
                                {p.label}
                              </span>
                            );
                          })
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[12px] font-semibold text-slate-600">{count}명</span>
                    </td>
                    <td className="hidden whitespace-nowrap px-5 py-4 text-slate-500 md:table-cell">{team.createdAt}</td>
                    <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                      {pendingDelTeamId === team.id ? (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onDeleteTeam(team.id)}
                            disabled={isPending}
                            className="rounded-lg px-2.5 py-1.5 text-[12px] font-semibold text-red-500 hover:bg-red-50 disabled:opacity-50"
                          >삭제</button>
                          <button onClick={() => setPendingDelTeamId(null)} className="rounded-lg p-1.5 text-slate-300 hover:bg-slate-100 hover:text-slate-500">
                            <X className="h-3.5 w-3.5" strokeWidth={2.5} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <ChevronRight className="h-4 w-4 text-slate-300" strokeWidth={2} />
                          <button onClick={() => setPendingDelTeamId(team.id)} className="rounded-lg p-1.5 text-slate-300 hover:bg-red-50 hover:text-red-400">
                            <Trash2 className="h-4 w-4" strokeWidth={2} />
                          </button>
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
                          if (e.key === "Enter") onCreateTeam(teamNameInput.trim());
                          if (e.key === "Escape") { setAddingTeam(false); setTeamNameInput(""); }
                        }}
                        placeholder="팀 이름 입력"
                        className="flex-1 rounded-lg border border-teal-300 bg-teal-50 px-3 py-1.5 text-[13.5px] text-slate-800 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
                      />
                      <button
                        onClick={() => onCreateTeam(teamNameInput.trim())}
                        disabled={!teamNameInput.trim() || isPending}
                        className="rounded-lg bg-teal-500 px-4 py-1.5 text-[13px] font-semibold text-white hover:bg-teal-600 disabled:opacity-40"
                      >추가</button>
                      <button onClick={() => { setAddingTeam(false); setTeamNameInput(""); }} className="rounded-lg p-1.5 text-slate-300 hover:bg-slate-100 hover:text-slate-500">
                        <X className="h-4 w-4" strokeWidth={2.5} />
                      </button>
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
                  "flex cursor-grab select-none items-center gap-2 rounded-xl border px-3 py-2 text-[13px] active:cursor-grabbing",
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
  );
}
