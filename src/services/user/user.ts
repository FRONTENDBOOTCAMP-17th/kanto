import { createClient } from "@/utils/supabase/server";
import type { User } from "@/type/user";

export async function getSessionUser(): Promise<User | null> {
  const supabase = await createClient();
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

export async function getIdentityVerified(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user?.user_metadata?.identity_verified === true;
}
