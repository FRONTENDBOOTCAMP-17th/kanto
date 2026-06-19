"use server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import type { SanctionRecord } from "@/services/admin/adminUsers";

const LABEL: Record<string, string> = {
  "7d": "7일 정지",
  "30d": "30일 정지",
  perm: "영구 정지",
};

const MESSAGE: Record<string, string> = {
  "7d": "관리자 조치로 인해 7일간 서비스 이용이 제한됩니다.",
  "30d": "관리자 조치로 인해 30일간 서비스 이용이 제한됩니다.",
  perm: "관리자 조치로 인해 계정이 영구 정지되었습니다.",
};

export async function applySanction(
  userId: number,
  sanctionType: "7d" | "30d" | "perm",
): Promise<SanctionRecord & { expires_at: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const admin = createAdminClient();

  let adminId: number | null = null;
  let adminName: string | null = null;
  if (user) {
    const { data } = await admin
      .from("users")
      .select("id, name")
      .eq("auth_id", user.id)
      .single();
    adminId = data?.id ?? null;
    adminName = data?.name ?? null;
  }

  const expiresAt =
    sanctionType === "perm"
      ? "9999-12-31T23:59:59Z"
      : (() => {
          const d = new Date();
          d.setDate(d.getDate() + (sanctionType === "7d" ? 7 : 30));
          return d.toISOString();
        })();

  await admin
    .from("users")
    .update({ suspended_until: expiresAt } as never)
    .eq("id", userId);

  const { data: inserted } = await admin
    .from("user_sanctions")
    .insert({
      user_id: userId,
      admin_id: adminId,
      sanction_type: sanctionType,
      expires_at: expiresAt,
    } as never)
    .select("id, created_at")
    .single();

  await admin.from("common_notifications").insert({
    receiver_id: userId,
    title: "계정이 정지되었습니다",
    body: MESSAGE[sanctionType],
    type: "suspension",
  } as never);

  return {
    id: (inserted as { id: number } | null)?.id ?? Date.now(),
    label: LABEL[sanctionType] ?? sanctionType,
    sanction_type: sanctionType,
    expires_at: expiresAt,
    created_at: (inserted as { created_at: string } | null)?.created_at ?? new Date().toISOString(),
    admin_name: adminName,
  };
}
