import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { updateSanctionTemplate } from "@/services/admin/adminContent";

async function getAdminUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  const { data } = await supabaseAdmin
    .from("users")
    .select("id, role")
    .eq("auth_id", user.id)
    .single();

  if (!data || data.role !== "admin") return null;
  return data as { id: number; role: string };
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const { title, body: templateBody } = body;

  if (!title || !templateBody) {
    return NextResponse.json({ error: "제목과 내용을 입력해주세요." }, { status: 400 });
  }

  try {
    const data = await updateSanctionTemplate(Number(id), { title, body: templateBody }, admin.id);
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
