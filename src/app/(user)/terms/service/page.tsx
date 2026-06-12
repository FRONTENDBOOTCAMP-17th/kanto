import { getNotionContent } from "@/services/notion/notion";
import TermsContent from "../_components/TermsContent";

export const revalidate = 3600;

export default async function ServiceTermsPage() {
  const content = await getNotionContent(process.env.NOTION_TERMS_SERVICE_PAGE_ID);
  return <TermsContent title="서비스 이용약관" content={content} />;
}
