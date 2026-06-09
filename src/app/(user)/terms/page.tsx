import Link from "next/link";

const termsList = [
  { label: "운영정책", href: "/terms/policy" },
  { label: "서비스 이용약관", href: "/terms/service" },
  { label: "개인정보 처리방침", href: "/terms/privacy" },
  { label: "청소년 보호정책", href: "/terms/youth" },
];

export default function TermsPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-8">약관 및 정책</h1>
      <ul className="divide-y divide-gray-200">
        {termsList.map((term) => (
          <li key={term.href}>
            <Link
              href={term.href}
              className="flex items-center justify-between py-4 hover:text-teal-600"
            >
              <span>{term.label}</span>
              <span>›</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
