import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getSpamConfig, updateSpamConfig } from "@/services/admin/adminContent";
import { insertAuditLog } from "@/services/admin/auditLog";

async function getAdminUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  const { data } = await supabaseAdmin
    .from("users")
    .select("id, role")
    .eq("auth_id", user.id)
    .single();

  if (!data || (data.role !== "admin" && data.role !== "super_admin")) return null;
  return data as { id: number; role: string };
}

export async function GET() {
  try {
    const data = await getSpamConfig();
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });

  const body = await req.json();
  const {
    chat_window_sec,
    chat_max_count,
    chat_cooldown_sec,
    post_window_sec,
    post_max_count,
    max_urls_per_post,
    profanity_strike_max,
    report_strike_max,
    auto_sanction_enabled,
  } = body;

  if (
    chat_window_sec == null ||
    chat_max_count == null ||
    chat_cooldown_sec == null ||
    post_window_sec == null ||
    post_max_count == null ||
    max_urls_per_post == null ||
    profanity_strike_max == null ||
    report_strike_max == null ||
    auto_sanction_enabled == null
  ) {
    return NextResponse.json({ error: "필수 항목이 누락되었습니다." }, { status: 400 });
  }

  try {
    const data = await updateSpamConfig(
      {
        chat_window_sec,
        chat_max_count,
        chat_cooldown_sec,
        post_window_sec,
        post_max_count,
        max_urls_per_post,
        profanity_strike_max,
        report_strike_max,
        auto_sanction_enabled,
      },
      admin.id,
    );
    insertAuditLog(admin, "update_spam", {
      targetType: "spam_config",
      targetId: 1,
      detail: { chat_window_sec, chat_max_count, chat_cooldown_sec, post_window_sec, post_max_count, max_urls_per_post, profanity_strike_max, report_strike_max, auto_sanction_enabled },
    });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
