import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getNotices, createNotice } from "@/services/admin/adminNotices";
import { insertAuditLog } from "@/services/admin/auditLog";
import { translateNoticeTitle } from "@/lib/translate";
import { requireAdminOrApiError } from "../_lib/requireAdmin";

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
  const admin = await requireAdminOrApiError();
  if (admin instanceof NextResponse) return admin;

  const body = await req.json();
  const { title, starts_at, ends_at } = body;

  if (!title || !starts_at || !ends_at) {
    return NextResponse.json({ error: "필수 항목이 누락되었습니다." }, { status: 400 });
  }

  try {
    const { title_en, title_fil } = await translateNoticeTitle(title);
    const data = await createNotice({ title, title_en, title_fil, starts_at, ends_at }, admin.id);
    await insertAuditLog(admin, "write_notice", { targetType: "notice", targetId: data.id, detail: { title, starts_at, ends_at } });
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
