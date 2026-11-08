import { ScopedIntlProvider } from "@/i18n/ScopedIntlProvider";

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return <ScopedIntlProvider segment="signup">{children}</ScopedIntlProvider>;
}
