import { NextRequest, NextResponse } from "next/server";
import { updateProfanityRule, deleteProfanityRule } from "@/services/admin/adminContent";
import { insertAuditLog } from "@/services/admin/auditLog";
import { requireAdminOrApiError } from "../../_lib/requireAdmin";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminOrApiError();
  if (admin instanceof NextResponse) return admin;

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
  const admin = await requireAdminOrApiError();
  if (admin instanceof NextResponse) return admin;

  const { id } = await params;

  try {
    await deleteProfanityRule(Number(id));
    await insertAuditLog(admin, "delete_profanity", { targetType: "profanity", targetId: Number(id) });
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
