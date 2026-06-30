import { createClient } from "@/utils/supabase/server";
import { PopularJobsClient } from "./_components/PopularJobsClient";

export default async function PopularJobsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: userRow } = user
    ? await supabase.from("users").select("role").eq("auth_id", user.id).single()
    : { data: null };

  const isSuperAdmin = userRow?.role === "super_admin";

  return <PopularJobsClient isSuperAdmin={isSuperAdmin} />;
}
