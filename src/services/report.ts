import { supabase } from "@/lib/supabase";

export async function checkReported(
  targetId: number,
  userId: number,
  targetType: "post" | "user" = "post",
) {
  const { data } = await supabase
    .from("common_reports")
    .select("id")
    .eq("target_id", targetId)
    .eq("target_type", targetType)
    .eq("user_id", userId)
    .maybeSingle();
  return !!data;
}

export async function submitReport(
  userId: number,
  targetId: number,
  category: string,
  content: string,
  targetType: "post" | "user" = "post",
) {
  const { error } = await supabase.from("common_reports").insert({
    user_id: userId,
    target_id: targetId,
    target_type: targetType,
    category,
    description: content || null,
    status: "pending",
  });
  return { error };
}
