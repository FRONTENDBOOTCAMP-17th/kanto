import { setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  redirect({ href: "/terms/policy", locale });
}
