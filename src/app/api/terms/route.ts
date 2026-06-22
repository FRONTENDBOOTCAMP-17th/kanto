import { getNotionPage } from "@/services/notion/notion";
import { NextRequest, NextResponse } from "next/server";

const PAGE_IDS: Record<string, Record<string, string | undefined>> = {
  ko: {
    service: process.env.NOTION_TERMS_SERVICE_PAGE_ID,
    terms: process.env.NOTION_TERMS_SERVICE_PAGE_ID,
    privacy: process.env.NOTION_TERMS_PRIVACY_PAGE_ID,
    payment: process.env.NOTION_TERMS_PAYMENT_PAGE_ID,
    policy: process.env.NOTION_TERMS_POLICY_PAGE_ID,
    youth: process.env.NOTION_TERMS_YOUTH_PAGE_ID,
  },
  en: {
    service: process.env.NOTION_TERMS_EN_SERVICE_PAGE_ID,
    terms: process.env.NOTION_TERMS_EN_SERVICE_PAGE_ID,
    privacy: process.env.NOTION_TERMS_EN_PRIVACY_PAGE_ID,
    payment: process.env.NOTION_TERMS_EN_PAYMENT_PAGE_ID,
    policy: process.env.NOTION_TERMS_EN_POLICY_PAGE_ID,
    youth: process.env.NOTION_TERMS_EN_YOUTH_PAGE_ID,
  },
  fil: {
    service: process.env.NOTION_TERMS_FIL_SERVICE_PAGE_ID,
    terms: process.env.NOTION_TERMS_FIL_SERVICE_PAGE_ID,
    privacy: process.env.NOTION_TERMS_FIL_PRIVACY_PAGE_ID,
    payment: process.env.NOTION_TERMS_FIL_PAYMENT_PAGE_ID,
    policy: process.env.NOTION_TERMS_FIL_POLICY_PAGE_ID,
    youth: process.env.NOTION_TERMS_FIL_YOUTH_PAGE_ID,
  },
};

const AGE_CONTENT: Record<string, string> = {
  ko: `본인은 만 18세 이상이며, 입력한 정보가 사실임을 확인합니다.\n\n**만 18세 이상입니다.** (확인하지 않을 경우 가입이 제한됩니다)`,
  en: `I confirm that I am 18 years of age or older and that the information I have entered is truthful.\n\n**I am 18 years of age or older.** (Registration will be restricted if this is not confirmed)`,
  fil: `Kinukumpirma ko na ako ay 18 taong gulang o mas matanda at ang impormasyong inilagay ko ay totoo.\n\n**Ako ay 18 taong gulang o mas matanda.** (Ang pagpaparehistro ay mapipigilan kung hindi ito makukumpirma)`,
};

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type");
  const locale = req.nextUrl.searchParams.get("locale") ?? "ko";
  const lang = PAGE_IDS[locale] ? locale : "ko";

  if (type === "age") {
    return NextResponse.json({ title: "", content: AGE_CONTENT[lang] ?? AGE_CONTENT.ko });
  }

  const pageIds = PAGE_IDS[lang];
  if (!type || !pageIds[type]) {
    return NextResponse.json({ error: "invalid type" }, { status: 400 });
  }

  const { title, content } = await getNotionPage(pageIds[type]!);
  return NextResponse.json({ title, content });
}
