import { ScopedIntlProvider } from "@/i18n/ScopedIntlProvider";

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return <ScopedIntlProvider segment="user">{children}</ScopedIntlProvider>;
}
