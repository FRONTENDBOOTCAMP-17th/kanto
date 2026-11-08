import { ScopedIntlProvider } from "@/i18n/ScopedIntlProvider";

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <ScopedIntlProvider segment="login">{children}</ScopedIntlProvider>;
}
