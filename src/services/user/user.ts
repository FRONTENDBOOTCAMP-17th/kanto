import { createClient } from "@/utils/supabase/server";
import type { User } from "@/type/user";

export async function getSessionUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return null;

  const { data } = await supabase
    .from("users")
    .select(
      "id, name, email, phone, region, auth_id, avatar_url, provider, role, post_count, created_at, updated_at",
    )
    .eq("auth_id", session.user.id)
    .single();

  return (data as User) ?? null;
}

// 본인인증 여부(auth 메타데이터)를 조회한다. 글쓰기 버튼의 인증 관문 분기에 사용한다.
export async function getIdentityVerified(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user?.user_metadata?.identity_verified === true;
}
