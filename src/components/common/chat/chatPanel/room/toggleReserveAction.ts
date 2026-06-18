"use server";

import { createClient } from "@/utils/supabase/server";

export async function toggleReserveAction(postId: number, isReserved: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("posts")
    .update({ is_reserved: isReserved })
    .eq("id", postId);
  if (error) throw error;
}
