import { NextRequest, NextResponse } from "next/server";
import { getProfanityRules } from "@/services/admin/adminContent";

export async function GET(req: NextRequest) {
  const text = req.nextUrl.searchParams.get("text") ?? "";

  if (!text.trim()) {
    return NextResponse.json({ blocked: false });
  }

  try {
    const rules = await getProfanityRules();
    const postRules = rules.filter((r) => r.scopes.includes("post"));
    const lower = text.toLowerCase();

    for (const rule of postRules) {
      for (const word of rule.words) {
        if (lower.includes(word.toLowerCase())) {
          return NextResponse.json({ blocked: true });
        }
      }
    }

    return NextResponse.json({ blocked: false });
  } catch {
    return NextResponse.json({ blocked: false });
  }
}
