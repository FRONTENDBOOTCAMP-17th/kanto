import { createAdminClient } from "@/utils/supabase/admin";

export type AuditTargetType =
  | "user"
  | "post"
  | "report"
  | "notice"
  | "maintenance"
  | "spam_config"
  | "profanity";

export interface AuditLog {
  id: number;
  actor_id: number;
  actor_nickname: string;
  actor_role: "admin" | "super_admin";
  action: string;
  target_type: AuditTargetType | null;
  target_id: number | null;
  target_label: string | null;
  detail: Record<string, unknown>;
  created_at: string;
}

export async function insertAuditLog(
  actor: { id: number; role: string },
  action: string,
  opts?: {
    targetType?: AuditTargetType;
    targetId?: number;
    detail?: Record<string, unknown>;
  },
): Promise<void> {
  try {
    const db = createAdminClient();
    await db.from("audit_logs").insert({
      actor_id: actor.id,
      actor_role: actor.role,
      action,
      target_type: opts?.targetType ?? null,
      target_id: opts?.targetId ?? null,
      detail: opts?.detail ?? {},
    } as never);
  } catch {
    
  }
}

export async function getAuditLogs(limit = 500): Promise<AuditLog[]> {
  const db = createAdminClient();

  const { data: logs, error } = await db
    .from("audit_logs")
    .select("id, actor_id, actor_role, action, target_type, target_id, detail, created_at")
    .order("created_at", { ascending: false })
    .limit(limit) as unknown as {
    data: Array<{
      id: number;
      actor_id: number;
      actor_role: string;
      action: string;
      target_type: string | null;
      target_id: number | null;
      detail: Record<string, unknown> | null;
      created_at: string;
    }> | null;
    error: { message: string } | null;
  };

  if (error) throw new Error(error.message);
  if (!logs?.length) return [];

  const actorIds = [...new Set(logs.map((l) => l.actor_id))];
  const { data: users } = await db
    .from("users")
    .select("id, name")
    .in("id", actorIds) as unknown as {
    data: Array<{ id: number; name: string }> | null;
  };

  const nameMap = new Map((users ?? []).map((u) => [u.id, u.name]));

  return logs.map((row) => {
    const detail = (row.detail ?? {}) as Record<string, unknown>;
    const targetLabel = typeof detail._label === "string" ? detail._label : null;
    const cleanDetail: Record<string, unknown> = { ...detail };
    delete cleanDetail._label;

    return {
      id: row.id,
      actor_id: row.actor_id,
      actor_nickname: nameMap.get(row.actor_id) ?? `관리자 #${row.actor_id}`,
      actor_role: row.actor_role as "admin" | "super_admin",
      action: row.action,
      target_type: (row.target_type as AuditTargetType) ?? null,
      target_id: row.target_id ?? null,
      target_label: targetLabel,
      detail: cleanDetail,
      created_at: row.created_at,
    };
  });
}
