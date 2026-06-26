"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, KeyRound, UserPlus, X } from "lucide-react";
import { ShieldAlert } from "lucide-react";
import type { AdminAccount, Team, AdminPermission } from "../actions";
import { AdminListTab } from "./AdminListTab";
import { TeamsTab } from "./TeamsTab";
import { CreateAdminTab } from "./CreateAdminTab";

type Tab = "list" | "teams" | "create";

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

  const adminIds = new Set<number>(admins.map((a) => a.id));

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

      <div className="p-6 lg:p-8">
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

        <div className="mb-5 overflow-x-auto">
          <div className="flex w-fit gap-1 rounded-xl border border-[#ebeef0] bg-slate-50 p-1">
            {([
              { key: "list",   label: "어드민 목록", icon: null },
              { key: "teams",  label: "팀 목록",     icon: null },
              { key: "create", label: "어드민 추가", icon: <UserPlus className="h-3.5 w-3.5" strokeWidth={2.5} /> },
            ] as const).map(({ key, label, icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={["flex cursor-pointer items-center gap-1.5 rounded-lg px-4 py-2 text-[13.5px] font-semibold transition-colors", tab === key ? "bg-white text-slate-800 shadow-sm" : "text-slate-400 hover:text-slate-600"].join(" ")}
              >
                {icon}{label}
              </button>
            ))}
          </div>
        </div>

        {tab === "list" && (
          <AdminListTab
            admins={admins}
            teams={teams}
            onAdminDeleted={(id) => setAdmins((prev) => prev.filter((a) => a.id !== id))}
            onAdminPromoted={(id) => setAdmins((prev) => prev.map((a) => a.id === id ? { ...a, role: "super_admin" } : a))}
          />
        )}

        {tab === "teams" && (
          <TeamsTab
            teams={teams}
            admins={admins}
            onTeamCreated={(team) => setTeams((prev) => [...prev, team])}
            onTeamDeleted={(id) => {
              setTeams((prev) => prev.filter((t) => t.id !== id));
              setAdmins((prev) => prev.map((a) => a.teamId === id ? { ...a, teamId: null } : a));
            }}
            onAdminRemovedFromTeam={(adminId) =>
              setAdmins((prev) => prev.map((a) => a.id === adminId ? { ...a, teamId: null } : a))
            }
            onTeamPermissionsUpdated={(teamId, perms: AdminPermission[]) =>
              setTeams((prev) => prev.map((t) => t.id === teamId ? { ...t, permissions: perms } : t))
            }
            onAdminAssigned={(adminId, teamId) =>
              setAdmins((prev) => prev.map((a) => a.id === adminId ? { ...a, teamId } : a))
            }
          />
        )}

        {tab === "create" && (
          <CreateAdminTab
            teams={teams}
            adminIds={adminIds}
            onAdminCreated={(admin) => {
              setAdmins((prev) => [...prev, admin]);
              setTab("list");
            }}
            onCancel={() => setTab("list")}
          />
        )}
      </div>
    </>
  );
}
