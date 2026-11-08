import TermsHeader from "@/app/[locale]/(user)/terms/_components/TermsHeader";
import TermsNav from "@/app/[locale]/(user)/terms/_components/TermsNav";
import { ScopedIntlProvider } from "@/i18n/ScopedIntlProvider";

export default async function TermsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <ScopedIntlProvider segment="terms" locale={locale}>
      <div className="min-h-screen bg-gray-900">
        <TermsHeader />
        <TermsNav />
        {children}
      </div>
    </ScopedIntlProvider>
  );
}
