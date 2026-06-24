import { cache } from "react";
import { createClient } from "@/utils/supabase/server";
import type { User } from "@/type/user";

// 한 요청 안에서 auth.getUser() 왕복을 공유한다.
// 여러 서비스(getSessionUser/getLikeList/getIdentityVerified 등)가 각자 호출하던 것을 dedupe.
export const getAuthUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

// auth_id → 내부 users.id 해석도 한 요청 1회로 공유.
export const getCurrentUserId = cache(async (): Promise<number | null> => {
  const authUser = await getAuthUser();
  if (!authUser) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("users")
    .select("id")
    .eq("auth_id", authUser.id)
    .single();

  return data?.id ?? null;
});

export const getSessionUser = cache(async (): Promise<User | null> => {
  const authUser = await getAuthUser();
  if (!authUser) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("users")
    .select(
      "id, name, email, phone, region, auth_id, avatar_url, provider, role, post_count, created_at, updated_at",
    )
    .eq("auth_id", authUser.id)
    .single();

  return (data as User) ?? null;
});

export async function getIdentityVerified(): Promise<boolean> {
  const user = await getAuthUser();
  return user?.user_metadata?.identity_verified === true;
}

export async function requireAdmin(): Promise<User> {
  const user = await getSessionUser();
  if (!user) throw new Error("UNAUTHORIZED");
  if (user.role !== "admin") throw new Error("FORBIDDEN");
  return user;
}
