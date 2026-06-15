import { getNotionContent } from "@/services/notion/notion";
import { NextRequest, NextResponse } from "next/server";

const PAGE_IDS: Record<string, string | undefined> = {
  terms: process.env.NOTION_TERMS_SERVICE_PAGE_ID,
  privacy: process.env.NOTION_TERMS_PRIVACY_PAGE_ID,
  age: process.env.NOTION_TERMS_AGE_PAGE_ID,
  payment: process.env.NOTION_TERMS_PAYMENT_PAGE_ID,
  policy: process.env.NOTION_TERMS_POLICY_PAGE_ID,
  youth: process.env.NOTION_TERMS_YOUTH_PAGE_ID,
};

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type");
  if (!type || !PAGE_IDS[type]) {
    return NextResponse.json({ error: "invalid type" }, { status: 400 });
  }

  const content = await getNotionContent(PAGE_IDS[type]);
  return NextResponse.json({ content });
}
