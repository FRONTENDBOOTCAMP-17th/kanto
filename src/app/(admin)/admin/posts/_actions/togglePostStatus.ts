"use server";

import { setPostStatus } from "@/services/admin/adminPosts";

export async function togglePostStatus(postId: number, status: "active" | "inactive") {
  await setPostStatus(postId, status);
}
