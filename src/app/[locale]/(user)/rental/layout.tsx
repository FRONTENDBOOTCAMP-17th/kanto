import { ScopedIntlProvider } from "@/i18n/ScopedIntlProvider";

export default async function RentalLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <ScopedIntlProvider segment="rental" locale={locale}>
      {children}
    </ScopedIntlProvider>
  );
}
