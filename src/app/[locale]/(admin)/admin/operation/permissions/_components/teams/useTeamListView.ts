"use client";

import { useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import type { AdminAccount, Team } from "../../actions";
import { createTeam, deleteTeam, assignTeam } from "../../actions";

export function useTeamListView({
  admins, onTeamCreated, onTeamDeleted, onAdminAssigned,
}: {
  admins: AdminAccount[];
  onTeamCreated: (team: Team) => void;
  onTeamDeleted: (id: number) => void;
  onAdminAssigned: (adminId: number, teamId: number) => void;
}) {
  const [draggingAdminId, setDraggingAdminId] = useState<number | null>(null);
  const [dragOverTeamId, setDragOverTeamId] = useState<number | null>(null);
  const [addingTeam, setAddingTeam] = useState(false);
  const [teamNameInput, setTeamNameInput] = useState("");
  const [pendingDelTeamId, setPendingDelTeamId] = useState<number | null>(null);
  const teamInputRef = useRef<HTMLInputElement>(null);

  const createMutation = useMutation({
    mutationFn: createTeam,
    onSuccess: (newTeam) => {
      if (newTeam) onTeamCreated(newTeam);
      setTeamNameInput("");
      setAddingTeam(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTeam,
    onSuccess: (_, id) => { onTeamDeleted(id); setPendingDelTeamId(null); },
  });

  const assignMutation = useMutation({
    mutationFn: ({ adminId, teamId }: { adminId: number; teamId: number }) => assignTeam(adminId, teamId),
    onSuccess: (_, { adminId, teamId }) => onAdminAssigned(adminId, teamId),
  });

  const isPending = createMutation.isPending || deleteMutation.isPending || assignMutation.isPending;
  const unassigned = admins.filter((a) => a.role === "admin" && a.teamId === null);

  return {
    draggingAdminId, setDraggingAdminId,
    dragOverTeamId, setDragOverTeamId,
    addingTeam, setAddingTeam,
    teamNameInput, setTeamNameInput,
    pendingDelTeamId, setPendingDelTeamId,
    teamInputRef,
    isPending, unassigned,
    onCreateTeam: (name: string) => createMutation.mutate(name),
    onDeleteTeam: (id: number) => deleteMutation.mutate(id),
    onAssignAdmin: (adminId: number, teamId: number) => assignMutation.mutate({ adminId, teamId }),
  };
}
