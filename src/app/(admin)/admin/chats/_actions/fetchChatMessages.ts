"use server";

import { requireAdmin } from "@/services/user/user";
import { getAdminChatMessages } from "@/services/admin/adminChats";

export async function fetchChatMessages(chatId: number, before?: string) {
  await requireAdmin();
  return getAdminChatMessages(chatId, before);
}
