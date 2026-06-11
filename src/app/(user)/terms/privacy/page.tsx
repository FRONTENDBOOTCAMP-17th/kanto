import { getNotionContent } from "@/services/notion/notion";
import TermsContent from "../_components/TermsContent";

export const revalidate = 3600;

export default async function PrivacyPage() {
  const content = await getNotionContent(process.env.NOTION_TERMS_PRIVACY_PAGE_ID);
  return <TermsContent title="개인정보 처리방침" content={content} />;
}
