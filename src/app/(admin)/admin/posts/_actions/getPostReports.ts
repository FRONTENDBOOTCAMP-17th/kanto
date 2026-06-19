"use server";

import { createAdminClient } from "@/utils/supabase/admin";

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
  const admin = createAdminClient();

  const { data } = await admin
    .from("common_reports")
    .select("id, reason, status, sanction_type, post_deactivated, resolved_at, handled_by")
    .eq("target_type", "post")
    .eq("target_id", postId)
    .order("created_at", { ascending: false }) as unknown as {
    data: Array<{
      id: number;
      reason: string | null;
      status: string;
      sanction_type: string | null;
      post_deactivated: boolean | null;
      resolved_at: string | null;
      handled_by: number | null;
    }> | null;
  };

  const rows = data ?? [];
  const adminIds = [
    ...new Set(rows.filter((r) => r.handled_by != null).map((r) => r.handled_by as number)),
  ];

  const { data: admins } = adminIds.length
    ? await admin.from("users").select("id, name").in("id", adminIds)
    : { data: [] as { id: number; name: string }[] };

  const adminMap = new Map((admins ?? []).map((a) => [a.id, a.name]));

  return rows.map((r) => ({
    id: r.id,
    reason: r.reason,
    status: r.status,
    sanction_type: r.sanction_type,
    post_deactivated: r.post_deactivated ?? false,
    resolved_at: r.resolved_at,
    admin_name: r.handled_by ? (adminMap.get(r.handled_by) ?? null) : null,
  }));
}
