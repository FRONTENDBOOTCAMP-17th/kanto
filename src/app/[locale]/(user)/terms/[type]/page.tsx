import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getNotionPage } from "@/services/notion/notion";
import TermsContent from "../_components/TermsContent";

export const revalidate = 86400;

// 빌드 시 Notion을 호출하지 않고 첫 방문 때 생성해 하루 동안 캐시한다.
export function generateStaticParams() {
  return [];
}

const PAGE_IDS: Record<string, Record<string, string | undefined>> = {
  ko: {
    service: process.env.NOTION_TERMS_SERVICE_PAGE_ID,
    privacy: process.env.NOTION_TERMS_PRIVACY_PAGE_ID,
    payment: process.env.NOTION_TERMS_PAYMENT_PAGE_ID,
    policy:  process.env.NOTION_TERMS_POLICY_PAGE_ID,
    youth:   process.env.NOTION_TERMS_YOUTH_PAGE_ID,
  },
  en: {
    service: process.env.NOTION_TERMS_EN_SERVICE_PAGE_ID,
    privacy: process.env.NOTION_TERMS_EN_PRIVACY_PAGE_ID,
    payment: process.env.NOTION_TERMS_EN_PAYMENT_PAGE_ID,
    policy:  process.env.NOTION_TERMS_EN_POLICY_PAGE_ID,
    youth:   process.env.NOTION_TERMS_EN_YOUTH_PAGE_ID,
  },
  fil: {
    service: process.env.NOTION_TERMS_FIL_SERVICE_PAGE_ID,
    privacy: process.env.NOTION_TERMS_FIL_PRIVACY_PAGE_ID,
    payment: process.env.NOTION_TERMS_FIL_PAYMENT_PAGE_ID,
    policy:  process.env.NOTION_TERMS_FIL_POLICY_PAGE_ID,
    youth:   process.env.NOTION_TERMS_FIL_YOUTH_PAGE_ID,
  },
};

const VALID = new Set(["service", "privacy", "youth", "payment", "policy"]);

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string; type: string }>;
}) {
  const { locale, type } = await params;
  setRequestLocale(locale);
  if (!VALID.has(type)) notFound();

  const lang = PAGE_IDS[locale] ? locale : "ko";
  const pageId = PAGE_IDS[lang][type];

  const data = await getNotionPage(pageId);

  // 실패 화면이 ISR로 하루 동안 캐시되지 않도록 에러로 던진다 (화면은 error.tsx가 그린다).
  // 재생성 중 실패하면 Next.js가 직전 정상 페이지를 계속 제공한다.
  if (!data) throw new Error("TERMS_UNAVAILABLE");

  const { title, content } = data;

  return <TermsContent title={title} content={content} />;
}
