"use server";

import { createAdminClient } from "@/utils/supabase/admin";

export async function refreshKtsScore() {
  const admin = createAdminClient();
  await admin.rpc("recalculate_kts" as never);
  await admin.rpc("recalculate_kpps" as never);
}
