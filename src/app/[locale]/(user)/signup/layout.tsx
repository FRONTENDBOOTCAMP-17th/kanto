import { ScopedIntlProvider } from "@/i18n/ScopedIntlProvider";

export default async function SignupLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <ScopedIntlProvider segment="signup" locale={locale}>
      {children}
    </ScopedIntlProvider>
  );
}
