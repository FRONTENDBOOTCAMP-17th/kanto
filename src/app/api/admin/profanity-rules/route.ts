import { NextRequest, NextResponse } from "next/server";
import { getProfanityRules, createProfanityRule } from "@/services/admin/adminContent";
import { insertAuditLog } from "@/services/admin/auditLog";
import { requireAdminOrApiError } from "../_lib/requireAdmin";

export async function GET() {
  const admin = await requireAdminOrApiError();
  if (admin instanceof NextResponse) return admin;
  try {
    const data = await getProfanityRules();
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const admin = await requireAdminOrApiError();
  if (admin instanceof NextResponse) return admin;

  const body = await req.json();
  const { scopes, words } = body;

  if (!scopes?.length || !words?.length) {
    return NextResponse.json({ error: "범위와 금칙어를 입력해주세요." }, { status: 400 });
  }

  try {
    const data = await createProfanityRule({ scopes, words }, admin.id);
    await insertAuditLog(admin, "add_profanity", { targetType: "profanity", targetId: data.id, detail: { scopes, words } });
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
