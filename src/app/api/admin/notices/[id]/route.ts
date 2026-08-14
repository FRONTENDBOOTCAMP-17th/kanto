import { NextRequest, NextResponse } from "next/server";
import { updateNotice, deleteNotice } from "@/services/admin/adminNotices";
import { insertAuditLog } from "@/services/admin/auditLog";
import { translateNoticeTitle } from "@/lib/translate";
import { requireAdminOrApiError } from "../../_lib/requireAdmin";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminOrApiError();
  if (admin instanceof NextResponse) return admin;

  const { id } = await params;
  const body = await req.json();
  const { title, starts_at, ends_at } = body;

  if (!title || !starts_at || !ends_at) {
    return NextResponse.json({ error: "필수 항목이 누락되었습니다." }, { status: 400 });
  }

  try {
    const { title_en, title_fil } = await translateNoticeTitle(title);
    const data = await updateNotice(Number(id), { title, title_en, title_fil, starts_at, ends_at });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminOrApiError();
  if (admin instanceof NextResponse) return admin;

  const { id } = await params;

  try {
    await deleteNotice(Number(id));
    await insertAuditLog(admin, "delete_notice", { targetType: "notice", targetId: Number(id) });
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
