import { notFound } from "next/navigation";
import dynamic from "next/dynamic";

const TermsClientContent = dynamic(
  () => import("../_components/TermsClientContent"),
  { ssr: false }
);

const VALID_TYPES = new Set(["service", "privacy", "youth", "age", "payment", "policy"]);

export default async function TermsPage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  if (!VALID_TYPES.has(type)) notFound();

  return <TermsClientContent key={type} type={type} />;
}
