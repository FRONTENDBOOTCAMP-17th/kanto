import { ScopedIntlProvider } from "@/i18n/ScopedIntlProvider";

export default async function UsedgoodsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <ScopedIntlProvider segment="usedgoods" locale={locale}>
      {children}
    </ScopedIntlProvider>
  );
}
