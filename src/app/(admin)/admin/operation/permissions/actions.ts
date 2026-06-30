"use server";

import { createAdminClient } from "@/utils/supabase/admin";
import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/services/user/user";
import { insertAuditLog } from "@/services/admin/auditLog";

export type AdminPermission =
  | "delete_post"
  | "handle_report"
  | "sanction_user"
  | "write_notice"
  | "view_stats"
  | "view_chat";

export type Team = {
  id: number;
  name: string;
  permissions: AdminPermission[];
  createdAt: string;
};

export type AdminAccount = {
  id: number;
  name: string;
  email: string;
  role: "admin" | "super_admin";
  teamId: number | null;
  createdAt: string;
};

export type UserResult = {
  id: number;
  name: string;
  email: string;
  joinedAt: string;
};

type RawAdmin = { id: number; name: string; email: string | null; role: string; admin_team_id: number | null; created_at: string };
type RawTeam  = { id: number; name: string; created_at: string; team_permissions: { permission: string }[] };
type RawUser  = { id: number; name: string; email: string | null; created_at: string };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const raw = (db: ReturnType<typeof createAdminClient>) => db as any;

export async function getAdmins(): Promise<AdminAccount[]> {
  const db = createAdminClient();
  const { data } = await raw(db)
    .from("users")
    .select("id, name, email, role, admin_team_id, created_at")
    .in("role", ["admin", "super_admin"])
    .order("created_at") as { data: RawAdmin[] | null };

  return (data ?? []).map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email ?? "",
    role: u.role as "admin" | "super_admin",
    teamId: u.admin_team_id,
    createdAt: String(u.created_at).slice(0, 10),
  }));
}

export async function getTeams(): Promise<Team[]> {
  const db = createAdminClient();
  const { data } = await raw(db)
    .from("admin_teams")
    .select("id, name, created_at, team_permissions(permission)")
    .order("created_at") as { data: RawTeam[] | null };

  return (data ?? []).map((t) => ({
    id: t.id,
    name: t.name,
    createdAt: String(t.created_at).slice(0, 10),
    permissions: (t.team_permissions ?? []).map((p) => p.permission as AdminPermission),
  }));
}

export async function searchUsers(query: string): Promise<UserResult[]> {
  if (!query.trim()) return [];
  const db = createAdminClient();
  const { data } = await raw(db)
    .from("users")
    .select("id, name, email, created_at")
    .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
    .limit(20) as { data: RawUser[] | null };

  return (data ?? []).map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email ?? "",
    joinedAt: String(u.created_at).slice(0, 10),
  }));
}

export async function promoteToAdmin(userId: number, teamId: number | null) {
  const db = createAdminClient();
  await raw(db).from("users").update({ role: "admin", admin_team_id: teamId }).eq("id", userId);
  const actor = await getSessionUser();
  if (actor) insertAuditLog(actor, "promote_admin", { targetType: "user", targetId: userId });
  revalidatePath("/admin/operation/permissions");
}

export async function revokeAdmin(userId: number) {
  const db = createAdminClient();
  await raw(db).from("users").update({ role: "user", admin_team_id: null }).eq("id", userId);
  const actor = await getSessionUser();
  if (actor) insertAuditLog(actor, "revoke_admin", { targetType: "user", targetId: userId });
  revalidatePath("/admin/operation/permissions");
}

export async function createTeam(name: string): Promise<Team | null> {
  const db = createAdminClient();
  const { data } = await raw(db)
    .from("admin_teams")
    .insert({ name })
    .select("id, name, created_at")
    .single() as { data: { id: number; name: string; created_at: string } | null };
  revalidatePath("/admin/operation/permissions");
  if (!data) return null;
  return { id: data.id, name: data.name, createdAt: String(data.created_at).slice(0, 10), permissions: [] };
}

export async function deleteTeam(teamId: number) {
  const db = createAdminClient();
  await raw(db).from("admin_teams").delete().eq("id", teamId);
  revalidatePath("/admin/operation/permissions");
}

export async function setTeamPermissions(teamId: number, permissions: AdminPermission[]) {
  const db = createAdminClient();
  await raw(db).from("team_permissions").delete().eq("team_id", teamId);
  if (permissions.length > 0) {
    await raw(db).from("team_permissions").insert(permissions.map((p) => ({ team_id: teamId, permission: p })));
  }
  revalidatePath("/admin/operation/permissions");
}

export async function assignTeam(adminId: number, teamId: number | null) {
  const db = createAdminClient();
  await raw(db).from("users").update({ admin_team_id: teamId }).eq("id", adminId);
  revalidatePath("/admin/operation/permissions");
}

export async function setAdminRole(userId: number, role: "admin" | "super_admin") {
  const db = createAdminClient();
  await raw(db).from("users").update({ role }).eq("id", userId);
  revalidatePath("/admin/operation/permissions");
}
