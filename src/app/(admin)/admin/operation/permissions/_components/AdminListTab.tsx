"use client";

import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Crown, ShieldCheck, Trash2, X, ChevronRight } from "lucide-react";
import type { AdminAccount, Team } from "../actions";
import { revokeAdmin, setAdminRole } from "../actions";

interface GroupHeaderProps {
  label: string;
  count: number;
  groupKey: string;
  collapsible?: boolean;
  isExpanded: boolean;
  onToggle: (key: string) => void;
}

function GroupHeader({ label, count, groupKey, collapsible = false, isExpanded, onToggle }: GroupHeaderProps) {
  return (
    <tr
      onClick={collapsible ? () => onToggle(groupKey) : undefined}
      className={collapsible ? "cursor-pointer select-none" : ""}
    >
      <td colSpan={4} className="border-b border-[#ebeef0] bg-slate-50 px-5 py-3.5 transition-colors hover:bg-slate-100">
        <div className="flex items-center gap-2">
          {collapsible && (
            <ChevronRight
              className={["h-3.5 w-3.5 text-slate-400 transition-transform duration-200", isExpanded ? "rotate-90" : ""].join(" ")}
              strokeWidth={2.5}
            />
          )}
          <span className="text-[12px] font-semibold text-slate-500">{label}</span>
          <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-500">{count}</span>
        </div>
      </td>
    </tr>
  );
}

interface AdminRowProps {
  admin: AdminAccount;
  isLast: boolean;
  team: Team | undefined;
  isPending: boolean;
  pendingDelAdminId: number | null;
  pendingRoleChangeId: number | null;
  onSetPendingDel: (id: number | null) => void;
  onSetPendingRole: (id: number | null) => void;
  onDelete: (id: number) => void;
  onPromote: (id: number) => void;
}

function AdminRow({
  admin, isLast, team, isPending,
  pendingDelAdminId, pendingRoleChangeId,
  onSetPendingDel, onSetPendingRole,
  onDelete, onPromote,
}: AdminRowProps) {
  const isSuperAdminRole = admin.role === "super_admin";
  return (
    <tr className={["transition-colors hover:bg-slate-50", !isLast ? "border-b border-[#ebeef0]" : ""].join(" ")}>
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className={["flex h-8 w-8 shrink-0 items-center justify-center rounded-full", isSuperAdminRole ? "bg-amber-100" : "bg-teal-50"].join(" ")}>
            {isSuperAdminRole
              ? <Crown className="h-4 w-4 text-amber-500" strokeWidth={2} />
              : <ShieldCheck className="h-4 w-4 text-teal-500" strokeWidth={2} />}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-slate-800">{admin.name}</p>
            <p className="truncate text-[12px] text-slate-400">{admin.email}</p>
          </div>
        </div>
      </td>
      <td className="whitespace-nowrap px-5 py-4">
        {isSuperAdminRole ? (
          <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[12px] font-semibold text-amber-600">전체</span>
        ) : team ? (
          <span className="rounded-full border border-teal-200 bg-teal-50 px-2.5 py-0.5 text-[12px] font-semibold text-teal-600">{team.name}</span>
        ) : (
          <span className="text-[12px] text-slate-300">미배정</span>
        )}
      </td>
      <td className="hidden whitespace-nowrap px-5 py-4 text-slate-500 md:table-cell">{admin.createdAt}</td>
      <td className="px-5 py-4">
        {!isSuperAdminRole && (
          pendingRoleChangeId === admin.id ? (
            <div className="flex items-center justify-end gap-1">
              <span className="hidden text-[12px] text-slate-500 sm:inline">슈퍼어드민으로 승격?</span>
              <button
                onClick={() => onPromote(admin.id)}
                disabled={isPending}
                className="rounded-lg px-2.5 py-1.5 text-[12px] font-semibold text-amber-500 hover:bg-amber-50 disabled:opacity-50"
              >확인</button>
              <button onClick={() => onSetPendingRole(null)} className="rounded-lg p-1.5 text-slate-300 hover:bg-slate-100 hover:text-slate-500">
                <X className="h-3.5 w-3.5" strokeWidth={2.5} />
              </button>
            </div>
          ) : pendingDelAdminId === admin.id ? (
            <div className="flex items-center justify-end gap-1">
              <button
                onClick={() => onDelete(admin.id)}
                disabled={isPending}
                className="rounded-lg px-2.5 py-1.5 text-[12px] font-semibold text-red-500 hover:bg-red-50 disabled:opacity-50"
              >삭제</button>
              <button onClick={() => onSetPendingDel(null)} className="rounded-lg p-1.5 text-slate-300 hover:bg-slate-100 hover:text-slate-500">
                <X className="h-3.5 w-3.5" strokeWidth={2.5} />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-end gap-1">
              <button
                onClick={() => onSetPendingRole(admin.id)}
                className="rounded-lg border border-[#ebeef0] px-2.5 py-1.5 text-[12px] font-medium text-slate-400 hover:bg-amber-50 hover:text-amber-500"
              >승격</button>
              <button onClick={() => onSetPendingDel(admin.id)} className="rounded-lg p-1.5 text-slate-300 hover:bg-red-50 hover:text-red-400">
                <Trash2 className="h-4 w-4" strokeWidth={2} />
              </button>
            </div>
          )
        )}
      </td>
    </tr>
  );
}

interface Props {
  admins: AdminAccount[];
  teams: Team[];
  onAdminDeleted: (id: number) => void;
  onAdminPromoted: (id: number) => void;
}

export function AdminListTab({ admins, teams, onAdminDeleted, onAdminPromoted }: Props) {
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
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-[#ebeef0] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
      <table className="w-full text-[13.5px]">
        <thead>
          <tr className="border-b border-[#ebeef0] text-left text-[12px] font-semibold uppercase tracking-wide text-slate-400">
            <th className="min-w-45 px-5 py-3.5">계정</th>
            <th className="px-5 py-3.5">권한</th>
            <th className="hidden whitespace-nowrap px-5 py-3.5 md:table-cell">추가일</th>
            <th className="px-5 py-3.5" />
          </tr>
        </thead>
        <tbody>
          {superAdmins.length > 0 && (
            <>
              <GroupHeader
                label="슈퍼어드민" count={superAdmins.length} groupKey="super_admin"
                collapsible isExpanded={expandedGroups.has("super_admin")} onToggle={toggleGroup}
              />
              {expandedGroups.has("super_admin") && superAdmins.map((a, i) => (
                <AdminRow
                  key={a.id} admin={a}
                  isLast={i === superAdmins.length - 1 && teams.length === 0 && unassigned.length === 0}
                  team={teams.find((t) => t.id === a.teamId)}
                  isPending={isPending}
                  pendingDelAdminId={pendingDelAdminId}
                  pendingRoleChangeId={pendingRoleChangeId}
                  onSetPendingDel={setPendingDelAdminId}
                  onSetPendingRole={setPendingRoleChangeId}
                  onDelete={(id) => deleteMutation.mutate(id)}
                  onPromote={(id) => promoteMutation.mutate(id)}
                />
              ))}
            </>
          )}
          {teams.map((team) => {
            const members = admins.filter((a) => a.teamId === team.id);
            const gKey = `team-${team.id}`;
            return (
              <React.Fragment key={team.id}>
                <GroupHeader
                  label={team.name} count={members.length} groupKey={gKey}
                  collapsible isExpanded={expandedGroups.has(gKey)} onToggle={toggleGroup}
                />
                {expandedGroups.has(gKey) && (members.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="border-b border-[#ebeef0] px-5 py-5 text-center text-[13px] text-slate-300">소속 어드민이 없습니다.</td>
                  </tr>
                ) : (
                  members.map((a, i) => (
                    <AdminRow
                      key={a.id} admin={a} isLast={i === members.length - 1}
                      team={team} isPending={isPending}
                      pendingDelAdminId={pendingDelAdminId}
                      pendingRoleChangeId={pendingRoleChangeId}
                      onSetPendingDel={setPendingDelAdminId}
                      onSetPendingRole={setPendingRoleChangeId}
                      onDelete={(id) => deleteMutation.mutate(id)}
                      onPromote={(id) => promoteMutation.mutate(id)}
                    />
                  ))
                ))}
              </React.Fragment>
            );
          })}
          {unassigned.length > 0 && (
            <>
              <GroupHeader
                label="미배정" count={unassigned.length} groupKey="unassigned"
                collapsible isExpanded={expandedGroups.has("unassigned")} onToggle={toggleGroup}
              />
              {expandedGroups.has("unassigned") && unassigned.map((a, i) => (
                <AdminRow
                  key={a.id} admin={a} isLast={i === unassigned.length - 1}
                  team={undefined} isPending={isPending}
                  pendingDelAdminId={pendingDelAdminId}
                  pendingRoleChangeId={pendingRoleChangeId}
                  onSetPendingDel={setPendingDelAdminId}
                  onSetPendingRole={setPendingRoleChangeId}
                  onDelete={(id) => deleteMutation.mutate(id)}
                  onPromote={(id) => promoteMutation.mutate(id)}
                />
              ))}
            </>
          )}
          {admins.length === 0 && (
            <tr>
              <td colSpan={4} className="py-16 text-center text-[13px] text-slate-300">등록된 어드민이 없습니다.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
