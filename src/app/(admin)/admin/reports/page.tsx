export const dynamic = "force-dynamic";

import { createAdminClient } from "@/utils/supabase/admin";
import { POST_TYPE_LABEL } from "../_lib/constants";
import type { Report, Status, Sanction } from "@/type/admin";
import ReportsClient from "./_components/ReportsClient";

export default async function ReportsPage() {
  const admin = createAdminClient();

  /* 1. 전체 신고 목록 */
  const { data: rawReports } = await admin
    .from("common_reports")
    .select("id, target_id, target_type, category, description, status, created_at, resolved_at, post_deactivated, sanction_type, sanction_expires_at, handled_by")
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
        sanction_type: string | null;
        sanction_expires_at: string | null;
        handled_by: number | null;
      }> | null;
      error: unknown;
    };

  const reports = rawReports ?? [];

  /* 2. 신고 대상 ID 수집 */
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

  /* 3. 게시글 + 유저 + 처리 관리자 배치 조회 */
  const [postsRes, targetUsersRes, adminUsersRes] = await Promise.all([
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
  ]);

  /* 4. 게시글 작성자 조회 */
  const authorIds = [
    ...new Set((postsRes.data ?? []).map((p) => p.user_id)),
  ];
  const { data: authorsData } = authorIds.length
    ? await admin.from("users").select("id, name").in("id", authorIds)
    : { data: [] as { id: number; name: string }[] };

  /* 5. 룩업 맵 */
  const postMap = new Map((postsRes.data ?? []).map((p) => [p.id, p]));
  const targetUserMap = new Map((targetUsersRes.data ?? []).map((u) => [u.id, u]));
  const authorMap = new Map((authorsData ?? []).map((u) => [u.id, u]));
  const adminUserMap = new Map((adminUsersRes.data ?? []).map((u) => [u.id, u]));

  /* 6. Report 목록 구성 */
  const reportList: Report[] = reports.map((r) => {
    const reason = r.category ?? "기타";
    const description = r.description ?? "";
    const status = (r.status ?? "pending") as Status;
    const reportDate = r.created_at.split("T")[0];
    const createdAt = r.created_at;
    const sanctionType = (r.sanction_type as Sanction | null) ?? null;
    const handledBy = r.handled_by ? (adminUserMap.get(r.handled_by)?.name ?? null) : null;

    if (r.target_type === "post") {
      const post = r.target_id != null ? postMap.get(r.target_id) : undefined;
      const author = post ? authorMap.get(post.user_id) : undefined;
      return {
        id: r.id,
        type: "post" as const,
        targetId: r.target_id ?? 0,
        authorId: post?.user_id,
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
        sanctionExpiresAt: r.sanction_expires_at,
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
      sanctionExpiresAt: r.sanction_expires_at,
      handledBy,
    };
  });

  return <ReportsClient reports={reportList} />;
}
