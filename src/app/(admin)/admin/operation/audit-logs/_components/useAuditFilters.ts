"use client";

import { useState } from "react";
import type { AuditLog, AuditTargetType } from "@/services/admin/auditLog";
import { PAGE_SIZE, type ActorRole } from "./auditLogConfig";

export function useAuditFilters(initialLogs: AuditLog[]) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<ActorRole | "all">("all");
  const [filterAction, setFilterAction] = useState<string>("all");
  const [filterTarget, setFilterTarget] = useState<AuditTargetType | "all">("all");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [actionDropdownOpen, setActionDropdownOpen] = useState(false);
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  const filtered = initialLogs.filter((log) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !q ||
      log.actor_nickname.toLowerCase().includes(q) ||
      log.target_label?.toLowerCase().includes(q) ||
      String(log.target_id).includes(q);
    const matchRole = filterRole === "all" || log.actor_role === filterRole;
    const matchAction = filterAction === "all" || log.action === filterAction;
    const matchTarget = filterTarget === "all" || log.target_type === filterTarget;
    const logDate = log.created_at.slice(0, 10);
    const matchDateFrom = !filterDateFrom || logDate >= filterDateFrom;
    const matchDateTo = !filterDateTo || logDate <= filterDateTo;
    return matchSearch && matchRole && matchAction && matchTarget && matchDateFrom && matchDateTo;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const hasActiveDate = filterDateFrom || filterDateTo;
  const hasActiveFilters =
    searchQuery || filterRole !== "all" || filterAction !== "all" || filterTarget !== "all" || hasActiveDate;

  function resetFilters() {
    setSearchQuery("");
    setFilterRole("all");
    setFilterAction("all");
    setFilterTarget("all");
    setFilterDateFrom("");
    setFilterDateTo("");
    setPage(1);
  }

  return {
    searchQuery, setSearchQuery,
    filterRole, setFilterRole,
    filterAction, setFilterAction,
    filterTarget, setFilterTarget,
    filterDateFrom, setFilterDateFrom,
    filterDateTo, setFilterDateTo,
    page, setPage,
    actionDropdownOpen, setActionDropdownOpen,
    dateDropdownOpen, setDateDropdownOpen,
    today,
    filtered,
    paginated,
    totalPages,
    hasActiveDate,
    hasActiveFilters,
    resetFilters,
  };
}
