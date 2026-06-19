import { createClient } from "@/utils/supabase/server";
import type { User } from "@/type/user";

export async function getSessionUser(): Promise<User | null> {
  const supabase = await createClient();
  // 서버 컴포넌트에서는 getSession()이 로그인 상태인데도 null을 반환할 수 있어
  // 인증 서버로 검증하는 getUser()를 사용한다. (새로고침 시 헤더 로그인 버튼 깜빡임 방지)
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  const { data } = await supabase
    .from("users")
    .select(
      "id, name, email, phone, region, auth_id, avatar_url, provider, role, post_count, created_at, updated_at",
    )
    .eq("auth_id", authUser.id)
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
