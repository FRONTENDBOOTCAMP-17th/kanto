"use client";

import { useState } from "react";
import type { AdminAccount, Team, AdminPermission } from "../../actions";
import { TeamListView } from "./TeamListView";
import { TeamDetailView } from "./TeamDetailView";

interface Props {
  teams: Team[];
  admins: AdminAccount[];
  onTeamCreated: (team: Team) => void;
  onTeamDeleted: (id: number) => void;
  onAdminRemovedFromTeam: (adminId: number) => void;
  onTeamPermissionsUpdated: (teamId: number, perms: AdminPermission[]) => void;
  onAdminAssigned: (adminId: number, teamId: number) => void;
}

export function TeamsTab({
  teams, admins,
  onTeamCreated, onTeamDeleted,
  onAdminRemovedFromTeam, onTeamPermissionsUpdated, onAdminAssigned,
}: Props) {
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const selectedTeam = teams.find((t) => t.id === selectedTeamId) ?? null;

  if (selectedTeam) {
    return (
      <TeamDetailView
        team={selectedTeam}
        admins={admins}
        onBack={() => setSelectedTeamId(null)}
        onAdminRemovedFromTeam={onAdminRemovedFromTeam}
        onTeamPermissionsUpdated={onTeamPermissionsUpdated}
      />
    );
  }

  return (
    <TeamListView
      teams={teams}
      admins={admins}
      onSelectTeam={(team) => setSelectedTeamId(team.id)}
      onTeamCreated={onTeamCreated}
      onTeamDeleted={onTeamDeleted}
      onAdminAssigned={onAdminAssigned}
    />
  );
}
