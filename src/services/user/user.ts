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
      "id, name, email, phone, auth_id, avatar_url, provider, role, post_count, created_at, updated_at",
    )
    .eq("auth_id", session.user.id)
    .single();

  return (data as User) ?? null;
}
