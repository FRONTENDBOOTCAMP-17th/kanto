"use server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

export async function togglePostStatus(
  postId: number,
  status: "active" | "inactive",
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const admin = createAdminClient();

  let handledById: number | null = null;
  if (user) {
    const { data } = await admin
      .from("users")
      .select("id")
      .eq("auth_id", user.id)
      .single();
    handledById = data?.id ?? null;
  }

  const { error } = await admin
    .from("posts")
    .update({
      status,
      handled_by: handledById,
      handled_at: new Date().toISOString(),
    } as never)
    .eq("id", postId);

  if (error) throw error;
}
