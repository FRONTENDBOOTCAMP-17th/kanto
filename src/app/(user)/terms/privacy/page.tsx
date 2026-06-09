import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { getNotionContent } from '@/services/notion/notion'

export const revalidate = 3600

export default async function PrivacyPage() {
  const content = await getNotionContent(process.env.NOTION_TERMS_PRIVACY_PAGE_ID!)

  return (
    <main className="min-h-screen bg-gray-900 text-gray-100">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold mb-8 text-white">개인정보 처리방침</h1>
        <div className="prose prose-sm prose-invert max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </div>
      </div>
    </main>
  )
}