"use server";

import { createAdminClient } from "@/utils/supabase/admin";
import { requireAdmin } from "@/services/user/user";
import { insertAuditLog } from "@/services/admin/auditLog";

export async function liftSanction(userId: number): Promise<void> {
  const sessionUser = await requireAdmin();
  const admin = createAdminClient();

  await admin
    .from("users")
    .update({ suspended_until: null } as never)
    .eq("id", userId);

  await admin.from("user_sanctions").insert({
    user_id: userId,
    admin_id: sessionUser.id,
    sanction_type: "lifted",
    expires_at: null,
  } as never);

  await admin.from("common_notifications").insert({
    receiver_id: userId,
    title: "계정 정지가 해제되었습니다",
    body: "관리자 조치로 인해 계정 정지가 해제되었습니다. 서비스를 정상적으로 이용하실 수 있습니다.",
    type: "suspension",
  } as never);

  insertAuditLog(sessionUser, "revoke_sanction", { targetType: "user", targetId: userId });
}
