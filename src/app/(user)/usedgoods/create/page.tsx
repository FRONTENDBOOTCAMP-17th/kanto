import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";
import { CreateUsedGoodsForm } from "./_components/CreateUsedGoodsForm";

export default async function CreateUsedGoodsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // 본인인증이 안 된 경우 인증 관문으로 돌려보낸다. (URL 직접 접근 차단)
  if (user.user_metadata?.identity_verified !== true) redirect("/create");

  // auth UUID → public.users.id (bigint) 조회
  const { data: dbUser } = await supabase
    .from("users")
    .select("id, deleted_at")
    .eq("auth_id", user.id)
    .single();

  if (!dbUser) redirect("/login");
  if (dbUser.deleted_at) redirect("/usedgoods");

  return (
    <div className="page-wrapper">
      <CreateUsedGoodsForm userId={dbUser.id} />
    </div>
  );
}
