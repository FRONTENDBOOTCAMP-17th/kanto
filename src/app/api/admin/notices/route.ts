import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getNotices, createNotice } from "@/services/admin/adminNotices";
import { insertAuditLog } from "@/services/admin/auditLog";
import { translateNoticeTitle } from "@/lib/translate";

async function getAdminUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
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
    const locale = (await cookies()).get("NEXT_LOCALE")?.value ?? "ko";
    const data = await getNotices();
    const localized = data.map(({ title, title_en, title_fil, ...rest }) => ({
      ...rest,
      title:
        locale === "en" ? (title_en ?? title) :
        locale === "fil" ? (title_fil ?? title) :
        title,
    }));
    return NextResponse.json(localized);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });

  const body = await req.json();
  const { title, starts_at, ends_at } = body;

  if (!title || !starts_at || !ends_at) {
    return NextResponse.json({ error: "필수 항목이 누락되었습니다." }, { status: 400 });
  }

  try {
    const { title_en, title_fil } = await translateNoticeTitle(title);
    const data = await createNotice({ title, title_en, title_fil, starts_at, ends_at }, admin.id);
    insertAuditLog(admin, "write_notice", { targetType: "notice", targetId: data.id, detail: { title, starts_at, ends_at } });
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
