"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import type { AdminAccount } from "../../actions";
import { revokeAdmin, setAdminRole } from "../../actions";

export function useAdminListTab({
  admins, onAdminDeleted, onAdminPromoted,
}: {
  admins: AdminAccount[];
  onAdminDeleted: (id: number) => void;
  onAdminPromoted: (id: number) => void;
}) {
  const [pendingDelAdminId, setPendingDelAdminId] = useState<number | null>(null);
  const [pendingRoleChangeId, setPendingRoleChangeId] = useState<number | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const deleteMutation = useMutation({
    mutationFn: revokeAdmin,
    onSuccess: (_, id) => { onAdminDeleted(id); setPendingDelAdminId(null); },
  });

  const promoteMutation = useMutation({
    mutationFn: (id: number) => setAdminRole(id, "super_admin"),
    onSuccess: (_, id) => { onAdminPromoted(id); setPendingRoleChangeId(null); },
  });

  const isPending = deleteMutation.isPending || promoteMutation.isPending;
  const superAdmins = admins.filter((a) => a.role === "super_admin");
  const unassigned = admins.filter((a) => a.role === "admin" && a.teamId === null);

  function toggleGroup(key: string) {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return {
    pendingDelAdminId, setPendingDelAdminId,
    pendingRoleChangeId, setPendingRoleChangeId,
    expandedGroups, toggleGroup,
    isPending, superAdmins, unassigned,
    onDelete: (id: number) => deleteMutation.mutate(id),
    onPromote: (id: number) => promoteMutation.mutate(id),
  };
}
