import { supabase } from "@/lib/supabase";
import { REPORTS_TABLE, REPORT_STATUS } from "@/constants/report";

export async function checkReported(
  targetId: number,
  userId: number,
  targetType: "post" | "user" | "message" = "post",
) {
  const { data } = await supabase
    .from(REPORTS_TABLE)
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
  targetType: "post" | "user" | "message" = "post",
) {
  const { error } = await supabase.from(REPORTS_TABLE).insert({
    user_id: userId,
    target_id: targetId,
    target_type: targetType,
    category,
    description: content || null,
    status: REPORT_STATUS.PENDING,
  });
  return { error };
}
