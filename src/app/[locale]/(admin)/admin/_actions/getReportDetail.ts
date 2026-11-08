"use server";

import { getAdminUsers, type User } from "@/services/admin/adminUsers";
import { getAdminPosts, type AdminPost } from "@/services/admin/adminPosts";

export async function getUserDetailAction(userId: number): Promise<User | null> {
  const users = await getAdminUsers();
  return users.find((u) => u.id === userId) ?? null;
}

export async function getPostDetailAction(postId: number): Promise<AdminPost | null> {
  const posts = await getAdminPosts();
  return posts.find((p) => p.id === postId) ?? null;
}
