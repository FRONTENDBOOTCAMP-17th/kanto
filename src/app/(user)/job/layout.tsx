import { ScopedIntlProvider } from "@/i18n/ScopedIntlProvider";

export default function JobLayout({ children }: { children: React.ReactNode }) {
  return <ScopedIntlProvider segment="job">{children}</ScopedIntlProvider>;
}
