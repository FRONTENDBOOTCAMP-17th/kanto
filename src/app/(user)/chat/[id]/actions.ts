"use server";

import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { postMessage } from "@/services/chat/message";

export async function sendMessageAction(params: {
  chatId: number;
  postId: number;
  content: string;
}) {
  const supabase = await createSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: userData } = await supabase
    .from("users")
    .select("id")
    .eq("auth_id", user.id)
    .single();

  if (!userData) throw new Error("User not found");

  return postMessage({ ...params, senderId: userData.id }, supabase);
}
