"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/utils/supabase/admin";
import { requireAdmin } from "@/services/user/user";
import { insertAuditLog } from "@/services/admin/auditLog";

export async function deletePost(postId: number): Promise<void> {
  const sessionUser = await requireAdmin();
  const admin = createAdminClient();

  const { error } = await admin
    .from("posts")
    .update({ status: "deleted", deleted_at: new Date().toISOString() } as never)
    .eq("id", postId);
  if (error) throw error;

  insertAuditLog(sessionUser, "delete_post", { targetType: "post", targetId: postId });

  revalidatePath("/admin/posts");
  revalidatePath("/admin");
}
