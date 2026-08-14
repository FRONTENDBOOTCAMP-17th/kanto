"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import type { AdminAccount, Team, UserResult } from "../../actions";
import { promoteToAdmin } from "../../actions";

export function useCreateAdminForm({
  onAdminCreated,
}: {
  onAdminCreated: (admin: AdminAccount) => void;
}) {
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

  return {
    selectedUser, setSelectedUser,
    selectedTeam, setSelectedTeam,
    userModalOpen, setUserModalOpen,
    teamModalOpen, setTeamModalOpen,
    isPending: createMutation.isPending,
    submit: () => selectedUser && createMutation.mutate({ userId: selectedUser.id, teamId: selectedTeam?.id ?? null }),
  };
}
