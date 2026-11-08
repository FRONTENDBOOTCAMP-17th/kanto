"use client";

import { useState } from "react";
import { KeyRound, UserPlus } from "lucide-react";
import type { AdminAccount, Team, AdminPermission } from "../actions";
import { AdminListTab } from "./list/AdminListTab";
import { TeamsTab } from "./teams/TeamsTab";
import { CreateAdminTab } from "./create/CreateAdminTab";
import { OperationPageHeader } from "@/components/admin/OperationPageHeader";

type Tab = "list" | "teams" | "create";

export function PermissionsClient({
  initialAdmins,
  initialTeams,
}: {
  initialAdmins: AdminAccount[];
  initialTeams: Team[];
}) {
  const [admins, setAdmins] = useState<AdminAccount[]>(initialAdmins);
  const [teams, setTeams] = useState<Team[]>(initialTeams);
  const [tab, setTab] = useState<Tab>("list");

  const adminIds = new Set<number>(admins.map((a) => a.id));

  return (
    <div className="p-6 lg:p-8">
      <OperationPageHeader
        icon={KeyRound}
        title="권한 관리"
        description="팀 단위로 권한을 설정하고 어드민 계정을 관리합니다. 슈퍼어드민 전용 페이지입니다."
      />

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
  );
}
