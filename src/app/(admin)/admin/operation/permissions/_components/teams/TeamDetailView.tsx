"use client";

import { ChevronLeft, ShieldCheck, Users, X, Check } from "lucide-react";
import type { AdminAccount, Team, AdminPermission } from "../../actions";
import { PERMISSIONS } from "../constants";
import { useTeamDetailView } from "./useTeamDetailView";

interface Props {
  team: Team;
  admins: AdminAccount[];
  onBack: () => void;
  onAdminRemovedFromTeam: (adminId: number) => void;
  onTeamPermissionsUpdated: (teamId: number, perms: AdminPermission[]) => void;
}

export function TeamDetailView({
  team, admins, onBack,
  onAdminRemovedFromTeam, onTeamPermissionsUpdated,
}: Props) {
  const {
    pendingExcludeId, setPendingExcludeId,
    isPending, togglePermission, removeMember,
  } = useTeamDetailView({ team, onAdminRemovedFromTeam, onTeamPermissionsUpdated });

  const members = admins.filter((a) => a.teamId === team.id);

  return (
    <div className="flex flex-col gap-5">
      <button
        onClick={onBack}
        className="flex w-fit items-center gap-1 text-[13px] text-slate-400 hover:text-slate-600"
      >
        <ChevronLeft className="h-3.5 w-3.5" strokeWidth={2.5} />팀 목록
      </button>

      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50">
          <Users className="h-5 w-5 text-teal-600" strokeWidth={2} />
        </div>
        <div>
          <h2 className="text-[18px] font-bold text-slate-900">{team.name}</h2>
          <p className="text-[12.5px] text-slate-400">멤버 {members.length}명 · {team.createdAt} 생성</p>
        </div>
      </div>

      <div className="rounded-2xl border border-[#ebeef0] bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
        <p className="mb-4 text-[14px] font-semibold text-slate-800">팀 권한</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {PERMISSIONS.map((p) => {
            const active = team.permissions.includes(p.key);
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => togglePermission(p.key)}
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

      <div className="overflow-x-auto rounded-2xl border border-[#ebeef0] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
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
                <th className="hidden whitespace-nowrap px-5 py-3.5 sm:table-cell">추가일</th>
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
                  <td className="hidden whitespace-nowrap px-5 py-4 text-slate-500 sm:table-cell">{member.createdAt}</td>
                  <td className="px-5 py-4">
                    {pendingExcludeId === member.id ? (
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => removeMember(member.id)}
                          disabled={isPending}
                          className="rounded-lg px-2.5 py-1.5 text-[12px] font-semibold text-red-500 hover:bg-red-50 disabled:opacity-50"
                        >제외</button>
                        <button onClick={() => setPendingExcludeId(null)} className="rounded-lg p-1.5 text-slate-300 hover:bg-slate-100 hover:text-slate-500">
                          <X className="h-3.5 w-3.5" strokeWidth={2.5} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-end">
                        <button
                          onClick={() => setPendingExcludeId(member.id)}
                          className="rounded-lg p-1.5 text-slate-300 hover:bg-red-50 hover:text-red-400"
                        >
                          <X className="h-4 w-4" strokeWidth={2} />
                        </button>
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
}
