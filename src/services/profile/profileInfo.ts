import { supabase } from "@/lib/supabase";
import type { User } from "@/type/user";

export async function uploadAvatar(userId: number, avatarFile: File): Promise<string> {
  const filePath = `avatars/${userId}/profile`;
  const { error } = await supabase.storage.from("images").upload(filePath, avatarFile, { upsert: true });
  if (error) throw new Error("프로필 사진 업로드에 실패했습니다.");
  const { data } = supabase.storage.from("images").getPublicUrl(filePath);
  return data.publicUrl + `?v=${Date.now()}`;
}

export async function updateProfile(
  userId: number,
  payload: { name: string; phone: string; region?: string | null; avatar_url: string | null },
): Promise<User> {
  const { data, error } = await supabase.from("users").update(payload).eq("id", userId).select().single();
  if (error) throw new Error("저장에 실패했습니다.");
  return data as User;
}

export async function saveBankAccount(
  userId: number,
  payload: { bank_code: string; bank_account_number: string; bank_account_name: string },
): Promise<void> {
  const { error } = await supabase.from("users").update(payload).eq("id", userId);
  if (error) throw new Error("계좌 저장에 실패했습니다.");
}

export async function fetchRestoredUser(authId: string): Promise<User | null> {
  const { data } = await supabase
    .from("users")
    .select("id, name, email, phone, auth_id, avatar_url, provider, role, post_count, created_at, updated_at, deleted_at, suspended_until")
    .eq("auth_id", authId)
    .single();
  return (data as User) ?? null;
}
