import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { getNotionPage } from "@/services/notion/notion";
import TermsContent from "../_components/TermsContent";

export const revalidate = 86400;

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
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  if (!VALID.has(type)) notFound();

  const locale = await getLocale();
  const lang = PAGE_IDS[locale] ? locale : "ko";
  const pageId = PAGE_IDS[lang][type];

  const { title, content } = await getNotionPage(pageId);

  if (!title && content.includes("불러올 수 없습니다")) {
    return (
      <main className="min-h-screen bg-gray-900 text-gray-400 flex items-center justify-center">
        현재 내용을 불러올 수 없습니다. 잠시 후 다시 시도해주세요.
      </main>
    );
  }

  return <TermsContent title={title} content={content} />;
}
