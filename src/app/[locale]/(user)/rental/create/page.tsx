import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";
import RentalCreateForm from "./_components/RentalCreateForm";

// 로그인 사용자 쿠키를 읽는 화면이므로 항상 동적 렌더링한다.
// (명시하지 않으면 try/catch로 감싼 cookies() 호출이 빌드 시 정적 렌더링으로 잘못 굳을 수 있다)
export const dynamic = "force-dynamic";

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
