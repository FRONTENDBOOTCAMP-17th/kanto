import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";
import { CreateJobForm } from "./_components/CreateJobForm";

export default async function CreateJobPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: dbUser } = await supabase
    .from("users")
    .select("id, deleted_at")
    .eq("auth_id", user.id)
    .single();

  if (!dbUser) redirect("/login");
  if (dbUser.deleted_at) redirect("/job");

  return (
    <div className="page-wrapper">
      <CreateJobForm userId={dbUser.id} />
    </div>
  );
}
