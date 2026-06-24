"use client";

import dynamic from "next/dynamic";

const TermsClientContent = dynamic(
  () => import("./TermsClientContent"),
  { ssr: false }
);

export default function TermsClientWrapper({ type, locale }: { type: string; locale: string }) {
  return <TermsClientContent type={type} locale={locale} />;
}
