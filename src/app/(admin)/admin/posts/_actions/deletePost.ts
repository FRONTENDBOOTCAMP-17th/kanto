"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/utils/supabase/admin";

export async function deletePost(postId: number): Promise<void> {
  const admin = createAdminClient();

  const { error } = await admin.from("posts").delete().eq("id", postId);
  if (error) throw error;

  revalidatePath("/admin/posts");
  revalidatePath("/admin");
}
