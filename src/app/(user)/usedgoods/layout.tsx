import { ScopedIntlProvider } from "@/i18n/ScopedIntlProvider";

export default function UsedgoodsLayout({ children }: { children: React.ReactNode }) {
  return <ScopedIntlProvider segment="usedgoods">{children}</ScopedIntlProvider>;
}
