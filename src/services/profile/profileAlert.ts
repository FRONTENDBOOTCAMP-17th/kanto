import { supabase } from "@/lib/supabase";

type AlertField = "alert_chat" | "alert_comment" | "alert_post";

export async function updateAlertToggle(userId: number, field: AlertField, value: boolean) {
  if (field === "alert_chat") return supabase.from("users").update({ alert_chat: value }).eq("id", userId);
  if (field === "alert_comment") return supabase.from("users").update({ alert_comment: value }).eq("id", userId);
  return supabase.from("users").update({ alert_post: value }).eq("id", userId);
}

export async function updateInterestCategories(userId: number, categories: string[] | null) {
  return supabase.from("users").update({ interest_categories: categories }).eq("id", userId);
}

export async function updateAlertKeywords(userId: number, keywords: string[] | null) {
  return supabase.from("users").update({ alert_keywords: keywords }).eq("id", userId);
}
