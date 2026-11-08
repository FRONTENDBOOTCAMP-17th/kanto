import { ScopedIntlProvider } from "@/i18n/ScopedIntlProvider";

export default async function MainLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <ScopedIntlProvider segment="main" locale={locale}>
      {children}
    </ScopedIntlProvider>
  );
}
