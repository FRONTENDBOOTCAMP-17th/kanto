import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { CreateUsedGoodsForm } from "./_components/CreateUsedGoodsForm";

export default async function CreateUsedGoodsPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // auth UUID → public.users.id (bigint) 조회
  const { data: dbUser } = await supabase
    .from("users")
    .select("id")
    .eq("auth_id", user.id)
    .single();

  if (!dbUser) redirect("/login");

  return (
    <div className="page-wrapper">
      <CreateUsedGoodsForm userId={dbUser.id} />
    </div>
  );
}
