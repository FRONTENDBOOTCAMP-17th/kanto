import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSpamConfig } from "@/services/admin/adminContent";

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: publicUser } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("auth_id", user.id)
    .single();

  if (!publicUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const config = await getSpamConfig().catch(() => null);
  const windowSec = config?.post_window_sec ?? 60;
  const maxCount = config?.post_max_count ?? 3;

  const since = new Date(Date.now() - windowSec * 1000).toISOString();
  const { count, error } = await supabaseAdmin
    .from("posts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", publicUser.id)
    .gte("created_at", since);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const currentCount = count ?? 0;
  if (currentCount >= maxCount) {
    return NextResponse.json(
      {
        allowed: false,
        message: "도배 방지를 위해서 짧은 시간동안 글 작성을 방지하고 있습니다. 잠시 후 다시 시도해주세요.",
        windowSec,
        maxCount,
        currentCount,
      },
      { status: 429 },
    );
  }

  return NextResponse.json({ allowed: true, windowSec, maxCount, currentCount });
}
