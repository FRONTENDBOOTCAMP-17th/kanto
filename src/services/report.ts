import { supabase } from "@/lib/supabase";

export async function checkReported(postId: number, userId: number) {
  const { data } = await supabase
    .from("common_reports")
    .select("id")
    .eq("target_id", postId)
    .eq("target_type", "post")
    .eq("user_id", userId)
    .single();
  return !!data;
}

export async function submitReport(
  userId: number,
  postId: number,
  category: string,
  content: string,
) {
  const { error } = await supabase.from("common_reports").insert({
    user_id: userId,
    target_id: postId,
    target_type: "post",
    category,
    description: content || null,
    status: "pending",
  });
  return { error };
}
