import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { updateNotice, deleteNotice } from "@/services/admin/adminNotices";

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

  if (!data || data.role !== "admin") return null;
  return data as { id: number; role: string };
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdminUser();
  if (!admin) return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  const { title, starts_at, ends_at } = body;

  if (!title || !starts_at || !ends_at) {
    return NextResponse.json({ error: "필수 항목이 누락되었습니다." }, { status: 400 });
  }

  try {
    const data = await updateNotice(Number(id), { title, starts_at, ends_at });
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
    await deleteNotice(Number(id));
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
