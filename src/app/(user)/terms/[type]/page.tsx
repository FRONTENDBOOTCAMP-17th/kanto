import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import TermsClientWrapper from "../_components/TermsClientWrapper";

const VALID_TYPES = new Set(["service", "privacy", "youth", "payment", "policy"]);

export default async function TermsPage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  if (!VALID_TYPES.has(type)) notFound();

  const locale = await getLocale();
  return <TermsClientWrapper key={`${type}_${locale}`} type={type} locale={locale} />;
}
