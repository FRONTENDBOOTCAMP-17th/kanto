"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

async function getCurrentAdminId(): Promise<number | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = createAdminClient();
  const { data } = await admin
    .from("users")
    .select("id")
    .eq("auth_id", user.id)
    .single();
  return data?.id ?? null;
}

/** 선택한 게시글들의 상태를 활성↔비공개로 각각 토글한다. */
export async function bulkTogglePostStatus(ids: number[]): Promise<void> {
  if (ids.length === 0) return;
  const admin = createAdminClient();
  const handledById = await getCurrentAdminId();
  const now = new Date().toISOString();

  const { data } = (await admin
    .from("posts")
    .select("id, status")
    .in("id", ids)) as { data: Array<{ id: number; status: string }> | null };

  const rows = data ?? [];
  const toInactive = rows.filter((p) => p.status === "active").map((p) => p.id);
  const toActive = rows.filter((p) => p.status !== "active").map((p) => p.id);

  if (toInactive.length) {
    await admin
      .from("posts")
      .update({ status: "inactive", handled_by: handledById, handled_at: now } as never)
      .in("id", toInactive);
  }
  if (toActive.length) {
    await admin
      .from("posts")
      .update({ status: "active", handled_by: handledById, handled_at: now } as never)
      .in("id", toActive);
  }

  revalidatePath("/admin/posts");
  revalidatePath("/admin");
}

/** 선택한 게시글들을 삭제한다. */
export async function bulkDeletePosts(ids: number[]): Promise<void> {
  if (ids.length === 0) return;
  const admin = createAdminClient();
  const { error } = await admin.from("posts").delete().in("id", ids);
  if (error) throw error;

  revalidatePath("/admin/posts");
  revalidatePath("/admin");
}
