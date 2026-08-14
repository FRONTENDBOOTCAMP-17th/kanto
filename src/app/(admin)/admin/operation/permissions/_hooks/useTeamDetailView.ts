"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import type { AdminPermission, Team } from "../actions";
import { setTeamPermissions, assignTeam } from "../actions";

export function useTeamDetailView({
  team, onAdminRemovedFromTeam, onTeamPermissionsUpdated,
}: {
  team: Team;
  onAdminRemovedFromTeam: (adminId: number) => void;
  onTeamPermissionsUpdated: (teamId: number, perms: AdminPermission[]) => void;
}) {
  const [pendingExcludeId, setPendingExcludeId] = useState<number | null>(null);

  const removeMutation = useMutation({
    mutationFn: (adminId: number) => assignTeam(adminId, null),
    onSuccess: (_, adminId) => { onAdminRemovedFromTeam(adminId); setPendingExcludeId(null); },
  });

  const permsMutation = useMutation({
    mutationFn: ({ teamId, perms }: { teamId: number; perms: AdminPermission[] }) =>
      setTeamPermissions(teamId, perms),
  });

  const isPending = removeMutation.isPending || permsMutation.isPending;

  function togglePermission(perm: AdminPermission) {
    const prevPerms = team.permissions;
    const newPerms = prevPerms.includes(perm)
      ? prevPerms.filter((p) => p !== perm)
      : [...prevPerms, perm];
    onTeamPermissionsUpdated(team.id, newPerms);
    permsMutation.mutate(
      { teamId: team.id, perms: newPerms },
      { onError: () => onTeamPermissionsUpdated(team.id, prevPerms) },
    );
  }

  return {
    pendingExcludeId, setPendingExcludeId,
    isPending,
    togglePermission,
    removeMember: (adminId: number) => removeMutation.mutate(adminId),
  };
}
