import { ScopedIntlProvider } from "@/i18n/ScopedIntlProvider";

export default async function LoginLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <ScopedIntlProvider segment="login" locale={locale}>
      {children}
    </ScopedIntlProvider>
  );
}
