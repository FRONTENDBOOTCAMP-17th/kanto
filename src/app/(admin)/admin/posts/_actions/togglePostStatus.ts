"use server";

import { createAdminClient } from "@/utils/supabase/admin";
import { requireAdmin } from "@/services/user/user";

export async function togglePostStatus(
  postId: number,
  status: "active" | "inactive",
) {
  const sessionUser = await requireAdmin();
  const admin = createAdminClient();

  const { error } = await admin
    .from("posts")
    .update({
      status,
      handled_by: sessionUser.id,
      handled_at: new Date().toISOString(),
    } as never)
    .eq("id", postId);

  if (error) throw error;
}
