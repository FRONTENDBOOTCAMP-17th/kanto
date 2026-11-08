import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Go.meta");
  return {
    title: t("title"),
    description: t("description"),
    openGraph: {
      title: t("title"),
      description: t("description"),
      type: "website",
    },
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_BASE_URL!.replace(/\/$/, "")}/go`,
    },
  };
}

export default function GoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
