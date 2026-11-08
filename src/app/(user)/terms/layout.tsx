import TermsHeader from "@/app/(user)/terms/_components/TermsHeader";
import TermsNav from "@/app/(user)/terms/_components/TermsNav";
import { ScopedIntlProvider } from "@/i18n/ScopedIntlProvider";

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return (
    <ScopedIntlProvider segment="terms">
      <div className="min-h-screen bg-gray-900">
        <TermsHeader />
        <TermsNav />
        {children}
      </div>
    </ScopedIntlProvider>
  );
}
