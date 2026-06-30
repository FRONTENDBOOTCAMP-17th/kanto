import { cache } from "react";
import { createClient } from "@/utils/supabase/server";
import type { User } from "@/type/user";

export const getAuthUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

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
      "id, name, email, phone, region, auth_id, avatar_url, provider, role, post_count, bank_code, bank_account_number, bank_account_name, created_at, updated_at",
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
  if (user.role !== "admin" && user.role !== "super_admin") throw new Error("FORBIDDEN");
  return user;
}

export async function requireSuperAdmin(): Promise<User> {
  const user = await getSessionUser();
  if (!user) throw new Error("UNAUTHORIZED");
  if (user.role !== "super_admin") throw new Error("FORBIDDEN");
  return user;
}
