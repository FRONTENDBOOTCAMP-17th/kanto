"use server";

import { createAdminClient } from "@/utils/supabase/admin";
import { requireAdmin } from "@/services/user/user";

export interface PostReport {
  id: number;
  reason: string | null;
  status: string;
  sanction_type: string | null;
  post_deactivated: boolean;
  resolved_at: string | null;
  admin_name: string | null;
}

export async function getPostReports(postId: number): Promise<PostReport[]> {
  await requireAdmin();
  const admin = createAdminClient();

  const { data } = await admin
    .from("common_reports")
    .select("id, reason, status, post_deactivated, resolved_at, handled_by")
    .eq("target_type", "post")
    .eq("target_id", postId)
    .order("created_at", { ascending: false }) as unknown as {
    data: Array<{
      id: number;
      reason: string | null;
      status: string;
      post_deactivated: boolean | null;
      resolved_at: string | null;
      handled_by: number | null;
    }> | null;
  };

  const rows = data ?? [];
  const adminIds = [
    ...new Set(rows.filter((r) => r.handled_by != null).map((r) => r.handled_by as number)),
  ];
  const reportIds = rows.map((r) => r.id);

  const [{ data: admins }, { data: sanctions }] = await Promise.all([
    adminIds.length
      ? admin.from("users").select("id, name").in("id", adminIds)
      : Promise.resolve({ data: [] as { id: number; name: string }[] }),
    reportIds.length
      ? admin
          .from("user_sanctions")
          .select("report_id, sanction_type, created_at")
          .in("report_id", reportIds)
          .order("created_at", { ascending: true })
      : Promise.resolve({ data: [] as { report_id: number | null; sanction_type: string; created_at: string | null }[] }),
  ]);

  const adminMap = new Map((admins ?? []).map((a) => [a.id, a.name]));

  
  const sanctionByReport = new Map<number, string>();
  for (const s of (sanctions ?? []) as Array<{ report_id: number | null; sanction_type: string }>) {
    if (s.report_id != null) sanctionByReport.set(s.report_id, s.sanction_type);
  }

  return rows.map((r) => ({
    id: r.id,
    reason: r.reason,
    status: r.status,
    sanction_type: sanctionByReport.get(r.id) ?? null,
    post_deactivated: r.post_deactivated ?? false,
    resolved_at: r.resolved_at,
    admin_name: r.handled_by ? (adminMap.get(r.handled_by) ?? null) : null,
  }));
}
