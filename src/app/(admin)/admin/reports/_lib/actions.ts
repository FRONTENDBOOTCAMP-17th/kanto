"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/utils/supabase/admin";
import type { Sanction, ReportType } from "@/type/admin";

function calcExpiresAt(sanction: Sanction): string | null {
  if (sanction === "none") return null;
  if (sanction === "perm") return "9999-12-31T23:59:59Z";
  const days = sanction === "7d" ? 7 : 30;
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function getSanctionMessage(sanction: Sanction): string {
  if (sanction === "7d") return "신고 처리로 인해 7일간 서비스 이용이 제한됩니다.";
  if (sanction === "30d") return "신고 처리로 인해 30일간 서비스 이용이 제한됩니다.";
  return "신고 처리로 인해 계정이 영구 정지되었습니다.";
}

function sanctionUserId(
  targetType: ReportType,
  targetId: number,
  authorId?: number,
): number | null {
  if (targetType === "user") return targetId;
  return authorId ?? null;
}

export async function resolveReport(
  reportId: number,
  opts: {
    targetType: ReportType;
    targetId: number;
    authorId?: number;
    deactivatePost: boolean;
    sanction: Sanction;
  },
): Promise<void> {
  const admin = createAdminClient();
  const expiresAt = calcExpiresAt(opts.sanction);

  await admin
    .from("common_reports")
    .update({
      status: "resolved",
      resolved_at: new Date().toISOString(),
      post_deactivated: opts.deactivatePost,
      sanction_type: opts.sanction !== "none" ? opts.sanction : null,
      sanction_expires_at: expiresAt,
    } as never)
    .eq("id", reportId);

  if (opts.deactivatePost && opts.targetType === "post") {
    await admin.from("posts").update({ status: "inactive" }).eq("id", opts.targetId);
  }

  const userId = sanctionUserId(opts.targetType, opts.targetId, opts.authorId);
  if (opts.sanction !== "none" && userId != null) {
    await admin
      .from("users")
      .update({ suspended_until: expiresAt } as never)
      .eq("id", userId);

    await admin.from("common_notifications").insert({
      receiver_id: userId,
      title: "계정이 정지되었습니다",
      body: getSanctionMessage(opts.sanction),
      type: "suspension",
    } as never);
  }

  revalidatePath("/admin/reports");
}

export async function dismissReport(reportId: number): Promise<void> {
  const admin = createAdminClient();

  await admin
    .from("common_reports")
    .update({
      status: "dismissed",
      resolved_at: new Date().toISOString(),
      post_deactivated: false,
      sanction_type: null,
      sanction_expires_at: null,
    } as never)
    .eq("id", reportId);

  revalidatePath("/admin/reports");
}

export async function updateReportResolution(
  reportId: number,
  opts: {
    targetType: ReportType;
    targetId: number;
    authorId?: number;
    prevDeactivated: boolean;
    deactivatePost: boolean;
    prevSanction: Sanction | null;
    sanction: Sanction;
  },
): Promise<void> {
  const admin = createAdminClient();
  const expiresAt = calcExpiresAt(opts.sanction);

  await admin
    .from("common_reports")
    .update({
      post_deactivated: opts.deactivatePost,
      sanction_type: opts.sanction !== "none" ? opts.sanction : null,
      sanction_expires_at: expiresAt,
      resolved_at: new Date().toISOString(),
    } as never)
    .eq("id", reportId);

  // 게시글 비활성화 상태 변경
  if (opts.targetType === "post") {
    if (!opts.prevDeactivated && opts.deactivatePost) {
      await admin.from("posts").update({ status: "inactive" }).eq("id", opts.targetId);
    } else if (opts.prevDeactivated && !opts.deactivatePost) {
      await admin.from("posts").update({ status: "active" }).eq("id", opts.targetId);
    }
  }

  // 제재 변경
  const userId = sanctionUserId(opts.targetType, opts.targetId, opts.authorId);
  if (userId != null) {
    const sanctionChanged = opts.sanction !== opts.prevSanction;
    if (sanctionChanged) {
      await admin
        .from("users")
        .update({ suspended_until: expiresAt } as never)
        .eq("id", userId);

      if (opts.sanction !== "none") {
        await admin.from("common_notifications").insert({
          receiver_id: userId,
          title: "계정이 정지되었습니다",
          body: getSanctionMessage(opts.sanction),
          type: "suspension",
        } as never);
      }
    }
  }

  revalidatePath("/admin/reports");
}
