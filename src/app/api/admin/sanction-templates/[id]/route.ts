import { NextRequest, NextResponse } from "next/server";
import { updateSanctionTemplate } from "@/services/admin/adminContent";
import { requireAdminOrApiError } from "../../_lib/requireAdmin";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminOrApiError();
  if (admin instanceof NextResponse) return admin;

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
