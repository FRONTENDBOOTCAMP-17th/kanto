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

// 만 18세 확인은 짧은 정적 문구라 Notion 대신 코드에서 직접 제공한다. (팀 전체 동일 동작)
const AGE_CONTENT = `본인은 만 18세 이상이며, 입력한 정보가 사실임을 확인합니다.

**만 18세 이상입니다.** (확인하지 않을 경우 가입이 제한됩니다)`;

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type");

  if (type === "age") {
    return NextResponse.json({ content: AGE_CONTENT });
  }

  if (!type || !PAGE_IDS[type]) {
    return NextResponse.json({ error: "invalid type" }, { status: 400 });
  }

  const content = await getNotionContent(PAGE_IDS[type]);
  return NextResponse.json({ content });
}
