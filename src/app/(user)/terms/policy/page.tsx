import ReactMarkdown from 'react-markdown'
import { getNotionContent } from '@/services/notion/notion'

export const revalidate = 3600

export default async function PolicyTermsPage() {
  const content = await getNotionContent()

  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-8">운영정책</h1>
      <div className="prose prose-sm max-w-none">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    </main>
  )
}