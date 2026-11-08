import { ScopedIntlProvider } from "@/i18n/ScopedIntlProvider";

export default function FavoritesLayout({ children }: { children: React.ReactNode }) {
  return <ScopedIntlProvider segment="favorites">{children}</ScopedIntlProvider>;
}
