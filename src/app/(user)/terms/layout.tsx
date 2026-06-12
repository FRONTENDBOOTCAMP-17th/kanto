import TermsHeader from "@/app/(user)/terms/_components/TermsHeader";
import TermsNav from "@/app/(user)/terms/_components/TermsNav";

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-900">
      <TermsHeader />
      <TermsNav />
      {children}
    </div>
  );
}
