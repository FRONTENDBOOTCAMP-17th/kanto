import { ScopedIntlProvider } from "@/i18n/ScopedIntlProvider";

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <ScopedIntlProvider segment="profile">{children}</ScopedIntlProvider>;
}
