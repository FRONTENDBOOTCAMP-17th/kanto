import { createAdminClient } from "@/utils/supabase/admin";

export interface Notice {
  id: number;
  title: string;
  starts_at: string;
  ends_at: string;
  created_at: string;
}

export async function getNotices(): Promise<Notice[]> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("notices")
    .select("id, title, starts_at, ends_at, created_at")
    .order("created_at", { ascending: false }) as unknown as {
    data: Notice[] | null;
    error: { message: string } | null;
  };

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createNotice(
  payload: { title: string; starts_at: string; ends_at: string },
  createdBy: number,
): Promise<Notice> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("notices")
    .insert({ ...payload, created_by: createdBy })
    .select("id, title, starts_at, ends_at, created_at")
    .single() as unknown as { data: Notice | null; error: { message: string } | null };

  if (error) throw new Error(error.message);
  return data!;
}

export async function updateNotice(
  id: number,
  payload: { title: string; starts_at: string; ends_at: string },
): Promise<Notice> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("notices")
    .update(payload)
    .eq("id", id)
    .select("id, title, starts_at, ends_at, created_at")
    .single() as unknown as { data: Notice | null; error: { message: string } | null };

  if (error) throw new Error(error.message);
  return data!;
}

export async function deleteNotice(id: number): Promise<void> {
  const admin = createAdminClient();

  const { error } = await admin
    .from("notices")
    .delete()
    .eq("id", id) as unknown as { error: { message: string } | null };

  if (error) throw new Error(error.message);
}
