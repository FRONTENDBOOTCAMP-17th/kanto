import { NextRequest, NextResponse } from "next/server";
import { searchPostsByWords } from "@/services/admin/adminContent";

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("words") ?? "";
  const words = raw
    .split(",")
    .map((w) => w.trim())
    .filter(Boolean);

  if (words.length === 0) {
    return NextResponse.json([]);
  }

  try {
    const data = await searchPostsByWords(words);
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
