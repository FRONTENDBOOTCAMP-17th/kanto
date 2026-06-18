import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";
import RentalCreateForm from "./_components/RentalCreateForm";

export default async function RentalCreatePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // 본인인증이 안 된 경우 인증 관문으로 돌려보낸다. (URL 직접 접근 차단)
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
