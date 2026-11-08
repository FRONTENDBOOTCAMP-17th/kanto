import { ScopedIntlProvider } from "@/i18n/ScopedIntlProvider";

export default async function JobLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <ScopedIntlProvider segment="job" locale={locale}>
      {children}
    </ScopedIntlProvider>
  );
}
