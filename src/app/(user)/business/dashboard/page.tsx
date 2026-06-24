import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getCompanyByUserId, getUserJobPostings } from "@/services/company/company";
import { BusinessDashboard } from "../_components/BusinessDashboard";

export default async function BusinessDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: dbUser } = await supabase
    .from("users")
    .select("id, name, deleted_at")
    .eq("auth_id", user.id)
    .single();

  if (!dbUser) redirect("/login");
  if (dbUser.deleted_at) redirect("/");

  const [company, jobs] = await Promise.all([
    getCompanyByUserId(dbUser.id),
    getUserJobPostings(dbUser.id),
  ]);

  return (
    <div className="page-wrapper">
      <BusinessDashboard userId={dbUser.id} company={company} initialJobs={jobs} />
    </div>
  );
}
