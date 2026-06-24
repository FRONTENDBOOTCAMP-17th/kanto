import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getCompanyByUserId } from "@/services/company/company";
import { CompanyCreateClient } from "./_components/CompanyCreateClient";

export default async function CompanyCreatePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: dbUser } = await supabase
    .from("users")
    .select("id, deleted_at")
    .eq("auth_id", user.id)
    .single();

  if (!dbUser) redirect("/login");
  if (dbUser.deleted_at) redirect("/");

  const existing = await getCompanyByUserId(dbUser.id);
  if (existing) redirect("/business/dashboard");

  return <CompanyCreateClient userId={dbUser.id} />;
}
