import { createClient } from "@/utils/supabase/server";

export async function getAdminUsers() {
  const supabase = await createClient();

  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("id, name, email, post_count, created_at")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (usersError) throw usersError;

  const { data: reports, error: reportsError } = await supabase
    .from("common_reports")
    .select("target_id")
    .eq("target_type", "user");

  if (reportsError) throw reportsError;

  const reportCountMap = new Map<number, number>();
  reports.forEach((report) => {
    if (report.target_id == null) return;
    const id: number = report.target_id;
    const count = reportCountMap.get(id) ?? 0;
    reportCountMap.set(id, count + 1);
  });

  return users.map((user) => ({
    ...user,
    report_count: reportCountMap.get(user.id) ?? 0,
  }));
}

export async function getAdminUserById(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("users")
    .select("id, name, email, created_at")
    .eq("id", Number(id))
    .single();

  if (error) throw error;
  return data;
}

export async function getAdminUserPosts(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("posts")
    .select("id, title, post_type, view_count, created_at")
    .eq("user_id", Number(id))
    .in("post_type", ["used_goods", "jobs", "rental"])
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}
