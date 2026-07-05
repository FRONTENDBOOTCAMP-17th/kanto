import { createAdminClient } from "@/utils/supabase/admin";

export interface Notice {
  id: number;
  title: string;
  title_en: string | null;
  title_fil: string | null;
  starts_at: string;
  ends_at: string;
  created_at: string;
}

export async function getNotices(): Promise<Notice[]> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("notices")
    .select("id, title, title_en, title_fil, starts_at, ends_at, created_at")
    .order("created_at", { ascending: false }) as unknown as {
    data: Notice[] | null;
    error: { message: string } | null;
  };

  if (error) throw new Error(error.message);
  return data ?? [];
}

export interface PublicNotice {
  id: number;
  title: string;
  starts_at: string;
  ends_at: string;
}

export async function getActivePublicNotices(locale: string): Promise<PublicNotice[]> {
  try {
    const data = await getNotices();
    const now = new Date();
    return data
      .filter((n) => new Date(n.starts_at) <= now && now <= new Date(n.ends_at))
      .map(({ id, title, title_en, title_fil, starts_at, ends_at }) => ({
        id,
        starts_at,
        ends_at,
        title:
          locale === "en" ? (title_en ?? title) :
          locale === "fil" ? (title_fil ?? title) :
          title,
      }));
  } catch {
    return [];
  }
}

export async function createNotice(
  payload: { title: string; title_en: string; title_fil: string; starts_at: string; ends_at: string },
  createdBy: number,
): Promise<Notice> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("notices")
    .insert({ ...payload, created_by: createdBy })
    .select("id, title, title_en, title_fil, starts_at, ends_at, created_at")
    .single() as unknown as { data: Notice | null; error: { message: string } | null };

  if (error) throw new Error(error.message);
  return data!;
}

export async function updateNotice(
  id: number,
  payload: { title: string; title_en: string; title_fil: string; starts_at: string; ends_at: string },
): Promise<Notice> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("notices")
    .update(payload)
    .eq("id", id)
    .select("id, title, title_en, title_fil, starts_at, ends_at, created_at")
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
