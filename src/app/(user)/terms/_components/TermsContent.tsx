import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Props {
  title: string;
  content: string;
}

export default function TermsContent({ title, content }: Props) {
  return (
    <main className="min-h-screen bg-gray-900 text-gray-100">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold mb-8 text-white">{title}</h1>
        <div className="prose prose-sm prose-invert max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </div>
      </div>
    </main>
  );
}
