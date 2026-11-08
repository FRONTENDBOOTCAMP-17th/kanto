import { ScopedIntlProvider } from "@/i18n/ScopedIntlProvider";

export default function RentalLayout({ children }: { children: React.ReactNode }) {
  return <ScopedIntlProvider segment="rental">{children}</ScopedIntlProvider>;
}
