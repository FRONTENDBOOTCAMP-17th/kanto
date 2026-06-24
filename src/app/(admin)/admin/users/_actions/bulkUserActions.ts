"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { REPORTS_TABLE, REPORT_STATUS } from "@/constants/report";

const MESSAGE: Record<string, string> = {
  "7d": "관리자 조치로 인해 7일간 서비스 이용이 제한됩니다.",
  "30d": "관리자 조치로 인해 30일간 서비스 이용이 제한됩니다.",
  perm: "관리자 조치로 인해 계정이 영구 정지되었습니다.",
};

async function getCurrentAdminId(): Promise<number | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = createAdminClient();
  const { data } = await admin
    .from("users")
    .select("id")
    .eq("auth_id", user.id)
    .single();
  return data?.id ?? null;
}

function calcExpiresAt(type: "7d" | "30d" | "perm"): string {
  if (type === "perm") return "9999-12-31T23:59:59Z";
  const d = new Date();
  d.setDate(d.getDate() + (type === "7d" ? 7 : 30));
  return d.toISOString();
}

/** 선택한 유저들에게 일괄 제재를 부여하고, 대기중 신고를 처리완료 처리한다. */
export async function bulkApplySanction(
  ids: number[],
  type: "7d" | "30d" | "perm",
): Promise<void> {
  if (ids.length === 0) return;
  const admin = createAdminClient();
  const adminId = await getCurrentAdminId();
  const expiresAt = calcExpiresAt(type);
  const now = new Date().toISOString();

  await admin
    .from("users")
    .update({ suspended_until: expiresAt } as never)
    .in("id", ids);

  await admin.from("user_sanctions").insert(
    ids.map((id) => ({
      user_id: id,
      admin_id: adminId,
      sanction_type: type,
      expires_at: expiresAt,
    })) as never,
  );

  await admin.from("common_notifications").insert(
    ids.map((id) => ({
      receiver_id: id,
      title: "계정이 정지되었습니다",
      body: MESSAGE[type],
      type: "suspension",
    })) as never,
  );

  await admin
    .from(REPORTS_TABLE)
    .update({
      status: REPORT_STATUS.RESOLVED,
      resolved_at: now,
      handled_by: adminId,
    } as never)
    .eq("target_type", "user")
    .in("target_id", ids)
    .eq("status", REPORT_STATUS.PENDING);

  revalidatePath("/admin/users");
  revalidatePath("/admin");
}

/** 선택한 유저들을 삭제(soft delete) 처리한다. */
export async function bulkDeleteUsers(ids: number[]): Promise<void> {
  if (ids.length === 0) return;
  const admin = createAdminClient();
  const { error } = await admin
    .from("users")
    .update({ deleted_at: new Date().toISOString() } as never)
    .in("id", ids);
  if (error) throw error;

  revalidatePath("/admin/users");
  revalidatePath("/admin");
}
