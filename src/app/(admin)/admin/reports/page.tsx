export const dynamic = "force-dynamic";

import { createAdminClient } from "@/utils/supabase/admin";
import { REPORTS_TABLE, REPORT_STATUS } from "@/constants/report";
import { POST_TYPE_LABEL } from "../_lib/constants";
import type { Report, Status, Sanction } from "@/type/admin";
import ReportsClient from "./_components/ReportsClient";

export default async function ReportsPage() {
  const admin = createAdminClient();

  
  const { data: rawReports } = await admin
    .from(REPORTS_TABLE)
    .select("id, target_id, target_type, category, description, status, created_at, resolved_at, post_deactivated, handled_by")
    .order("created_at", { ascending: false }) as {
      data: Array<{
        id: number;
        target_id: number | null;
        target_type: string | null;
        category: string | null;
        description: string | null;
        status: string | null;
        created_at: string;
        resolved_at: string | null;
        post_deactivated: boolean;
        handled_by: number | null;
      }> | null;
      error: unknown;
    };

  const reports = rawReports ?? [];

  
  const postIds = [
    ...new Set(
      reports
        .filter((r) => r.target_type === "post" && r.target_id != null)
        .map((r) => r.target_id as number),
    ),
  ];
  const targetUserIds = [
    ...new Set(
      reports
        .filter((r) => r.target_type === "user" && r.target_id != null)
        .map((r) => r.target_id as number),
    ),
  ];
  const adminIds = [
    ...new Set(
      reports
        .filter((r) => r.handled_by != null)
        .map((r) => r.handled_by as number),
    ),
  ];

  
  const reportIds = reports.map((r) => r.id);
  const [postsRes, targetUsersRes, adminUsersRes, sanctionsRes] = await Promise.all([
    postIds.length
      ? admin
          .from("posts")
          .select("id, title, post_type, user_id")
          .in("id", postIds)
      : { data: [] as { id: number; title: string; post_type: string; user_id: number }[] },
    targetUserIds.length
      ? admin.from("users").select("id, name").in("id", targetUserIds)
      : { data: [] as { id: number; name: string }[] },
    adminIds.length
      ? admin.from("users").select("id, name").in("id", adminIds)
      : { data: [] as { id: number; name: string }[] },
    reportIds.length
      ? admin
          .from("user_sanctions")
          .select("report_id, sanction_type, expires_at, created_at")
          .in("report_id", reportIds)
          .order("created_at", { ascending: true })
      : { data: [] as { report_id: number | null; sanction_type: string; expires_at: string | null; created_at: string | null }[] },
  ]);

  
  const sanctionByReport = new Map<number, { sanction_type: string; expires_at: string | null }>();
  for (const s of (sanctionsRes.data ?? []) as Array<{
    report_id: number | null;
    sanction_type: string;
    expires_at: string | null;
  }>) {
    if (s.report_id != null) {
      sanctionByReport.set(s.report_id, { sanction_type: s.sanction_type, expires_at: s.expires_at });
    }
  }

  
  const authorIds = [
    ...new Set((postsRes.data ?? []).map((p) => p.user_id)),
  ];
  const { data: authorsData } = authorIds.length
    ? await admin.from("users").select("id, name").in("id", authorIds)
    : { data: [] as { id: number; name: string }[] };

  
  const postMap = new Map((postsRes.data ?? []).map((p) => [p.id, p]));
  const targetUserMap = new Map((targetUsersRes.data ?? []).map((u) => [u.id, u]));
  const authorMap = new Map((authorsData ?? []).map((u) => [u.id, u]));
  const adminUserMap = new Map((adminUsersRes.data ?? []).map((u) => [u.id, u]));

  
  const reportList: Report[] = reports.map((r) => {
    const reason = r.category ?? "기타";
    const description = r.description ?? "";
    const status = (r.status ?? REPORT_STATUS.PENDING) as Status;
    const reportDate = r.created_at.split("T")[0];
    const createdAt = r.created_at;
    const sanc = sanctionByReport.get(r.id);
    const sanctionType = (sanc?.sanction_type as Sanction | null) ?? null;
    const sanctionExpiresAt = sanc?.expires_at ?? null;
    const handledBy = r.handled_by ? (adminUserMap.get(r.handled_by)?.name ?? null) : null;

    if (r.target_type === "post") {
      const post = r.target_id != null ? postMap.get(r.target_id) : undefined;
      const author = post ? authorMap.get(post.user_id) : undefined;
      return {
        id: r.id,
        type: "post" as const,
        targetId: r.target_id ?? 0,
        authorId: post?.user_id,
        postType: post?.post_type,
        targetName: post?.title ?? "(삭제된 게시글)",
        category: POST_TYPE_LABEL[post?.post_type ?? ""] ?? "커뮤니티",
        author: author?.name ?? "알 수 없음",
        reason,
        description,
        reportDate,
        createdAt,
        status,
        resolvedAt: r.resolved_at,
        postDeactivated: r.post_deactivated,
        sanctionType,
        sanctionExpiresAt,
        handledBy,
      };
    }

    const targetUser = r.target_id != null ? targetUserMap.get(r.target_id) : undefined;
    return {
      id: r.id,
      type: "user" as const,
      targetId: r.target_id ?? 0,
      targetName: targetUser?.name ?? "(탈퇴한 회원)",
      reason,
      description,
      reportDate,
      createdAt,
      status,
      resolvedAt: r.resolved_at,
      postDeactivated: r.post_deactivated,
      sanctionType,
      sanctionExpiresAt,
      handledBy,
    };
  });

  return <ReportsClient reports={reportList} />;
}
