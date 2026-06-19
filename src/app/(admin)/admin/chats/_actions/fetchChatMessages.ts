"use server";

import { getAdminChatMessages } from "@/services/admin/adminChats";

export async function fetchChatMessages(chatId: number, before?: string) {
  return getAdminChatMessages(chatId, before);
}
