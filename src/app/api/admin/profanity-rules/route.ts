import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getProfanityRules, createProfanityRule } from "@/services/admin/adminContent";
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
    const data = await getProfanityRules();
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });

  const body = await req.json();
  const { scopes, words } = body;

  if (!scopes?.length || !words?.length) {
    return NextResponse.json({ error: "범위와 금칙어를 입력해주세요." }, { status: 400 });
  }

  try {
    const data = await createProfanityRule({ scopes, words }, admin.id);
    insertAuditLog(admin, "add_profanity", { targetType: "profanity", targetId: data.id, detail: { scopes, words } });
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
