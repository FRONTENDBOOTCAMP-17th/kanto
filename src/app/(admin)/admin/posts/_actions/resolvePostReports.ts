"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { REPORTS_TABLE, REPORT_STATUS } from "@/constants/report";

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

/** 해당 게시글을 대상으로 한 대기중 신고를 모두 처리완료 처리한다. */
export async function resolvePostReports(postId: number): Promise<void> {
  const admin = createAdminClient();
  const adminId = await getCurrentAdminId();

  await admin
    .from(REPORTS_TABLE)
    .update({
      status: REPORT_STATUS.RESOLVED,
      resolved_at: new Date().toISOString(),
      handled_by: adminId,
    } as never)
    .eq("target_type", "post")
    .eq("target_id", postId)
    .eq("status", REPORT_STATUS.PENDING);

  revalidatePath("/admin/posts");
  revalidatePath("/admin");
}
