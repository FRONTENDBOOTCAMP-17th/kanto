"use server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

export async function liftSanction(userId: number): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const admin = createAdminClient();

  let adminId: number | null = null;
  if (user) {
    const { data } = await admin
      .from("users")
      .select("id")
      .eq("auth_id", user.id)
      .single();
    adminId = data?.id ?? null;
  }

  await admin
    .from("users")
    .update({ suspended_until: null } as never)
    .eq("id", userId);

  // 해제 이력도 기록
  await admin.from("user_sanctions").insert({
    user_id: userId,
    admin_id: adminId,
    sanction_type: "lifted",
    expires_at: null,
  } as never);

  await admin.from("common_notifications").insert({
    receiver_id: userId,
    title: "계정 정지가 해제되었습니다",
    body: "관리자 조치로 인해 계정 정지가 해제되었습니다. 서비스를 정상적으로 이용하실 수 있습니다.",
    type: "suspension",
  } as never);
}
