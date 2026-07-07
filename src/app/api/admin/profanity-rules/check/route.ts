import { NextRequest, NextResponse } from "next/server";
import { containsProfanity } from "@/services/admin/adminContent";

export async function GET(req: NextRequest) {
  const text = req.nextUrl.searchParams.get("text") ?? "";
  return NextResponse.json({ blocked: await containsProfanity(text, "post") });
}
