import { ScopedIntlProvider } from "@/i18n/ScopedIntlProvider";

export default function MypostsLayout({ children }: { children: React.ReactNode }) {
  return <ScopedIntlProvider segment="myposts">{children}</ScopedIntlProvider>;
}
