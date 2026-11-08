import { ScopedIntlProvider } from "@/i18n/ScopedIntlProvider";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return <ScopedIntlProvider segment="main">{children}</ScopedIntlProvider>;
}
