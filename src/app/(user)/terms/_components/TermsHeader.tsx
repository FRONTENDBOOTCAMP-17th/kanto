import Image from "next/image";
import Link from "next/link";

export default function TermsHeader() {
  return (
    <header className="sticky top-0 z-50 bg-gray-900 border-b border-gray-700">
      <div className="max-w-3xl mx-auto px-4 flex justify-between items-center">
        <div className="flex items-center h-16">
          <Link href="/terms" className="flex items-end hover:opacity-80 transition-opacity">
            <Image src="/kantoMobileLogo.png" alt="kanto" width={40} height={40} />
            <span className="text-teal-600 font-extrabold -ml-1.5 -mb-1">고객지원</span>
          </Link>
        </div>
        <Link href="/" className="text-sm font-medium text-gray-400 hover:text-teal-500 transition-colors flex items-center gap-1">
          홈으로 이동
        </Link>
      </div>
    </header>
  );
}
