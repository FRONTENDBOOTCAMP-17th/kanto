import { notFound } from "next/navigation";
import { getNotionPage } from "@/services/notion/notion";
import TermsContent from "../_components/TermsContent";

export const revalidate = 3600;

const TERMS_MAP: Record<string, string | undefined> = {
  service: process.env.NOTION_TERMS_SERVICE_PAGE_ID,
  privacy: process.env.NOTION_TERMS_PRIVACY_PAGE_ID,
  youth:   process.env.NOTION_TERMS_YOUTH_PAGE_ID,
  age:     process.env.NOTION_TERMS_AGE_PAGE_ID,
  payment: process.env.NOTION_TERMS_PAYMENT_PAGE_ID,
  policy:  process.env.NOTION_TERMS_POLICY_PAGE_ID,
};

export default async function TermsPage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  const pageId = TERMS_MAP[type];
  if (!pageId) notFound();

  const { title, content } = await getNotionPage(pageId);
  return <TermsContent title={title} content={content} />;
}
