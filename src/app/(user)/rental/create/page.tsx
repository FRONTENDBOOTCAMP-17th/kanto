import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";
import RentalCreateForm from "./_components/RentalCreateForm";

export default async function RentalCreatePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  if (user.user_metadata?.identity_verified !== true) redirect("/create");

  const { data: dbUser } = await supabase
    .from("users")
    .select("id")
    .eq("auth_id", user.id)
    .single();

  if (!dbUser) redirect("/login");

  return (
    <div className="page-wrapper">
      <RentalCreateForm userId={dbUser.id} />
    </div>
  );
}
