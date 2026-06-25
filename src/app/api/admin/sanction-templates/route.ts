import { NextResponse } from "next/server";
import { getSanctionTemplates } from "@/services/admin/adminContent";

export async function GET() {
  try {
    const data = await getSanctionTemplates();
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
