import { getNotionContent } from "@/services/notion/notion";
import TermsContent from "../_components/TermsContent";

export const revalidate = 3600;

export default async function PolicyTermsPage() {
  const content = await getNotionContent(process.env.NOTION_TERMS_POLICY_PAGE_ID);
  return <TermsContent title="운영정책" content={content} />;
}
