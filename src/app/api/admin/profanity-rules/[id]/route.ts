import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { updateProfanityRule, deleteProfanityRule } from "@/services/admin/adminContent";
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

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const { scopes, words } = body;

  if (!scopes?.length || !words?.length) {
    return NextResponse.json({ error: "범위와 금칙어를 입력해주세요." }, { status: 400 });
  }

  try {
    const data = await updateProfanityRule(Number(id), { scopes, words });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });

  const { id } = await params;

  try {
    await deleteProfanityRule(Number(id));
    insertAuditLog(admin, "delete_profanity", { targetType: "profanity", targetId: Number(id) });
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
