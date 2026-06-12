import { getNotionContent } from "@/services/notion/notion";
import TermsContent from "../_components/TermsContent";

export const revalidate = 3600;

export default async function YouthTermsPage() {
  const content = await getNotionContent(process.env.NOTION_TERMS_YOUTH_PAGE_ID);
  return <TermsContent title="청소년 보호정책" content={content} />;
}
