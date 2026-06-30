import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";

export default async function NotFound() {
  const t = await getTranslations("NotFound");

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-10 text-center px-4">

      <div className="flex items-center justify-center gap-1">
        <span className="text-[200px] font-semibold leading-none tracking-tighter text-slate-800">
          4
        </span>

        <div className="relative w-32 h-37.5 mx-1 shrink-0" aria-label="kanto">
          <div className="absolute left-2.25 top-0 w-27.5 h-27.5 bg-teal-500 rounded-[50%_50%_50%_0] -rotate-45" />
          <svg
            viewBox="0 0 64 64"
            className="absolute left-8 top-6 w-16 h-16"
            fill="none"
            stroke="#fff"
            strokeWidth="4.5"
            strokeLinecap="round"
          >
            <path d="M14 27 Q20 20 26 27" />
            <path d="M38 27 Q44 20 50 27" />
            <path d="M21 41 Q32 53 43 41" />
          </svg>
        </div>

        <span className="text-[200px] font-semibold leading-none tracking-tighter text-slate-800">
          4
        </span>
      </div>

      <div className="flex flex-col items-center gap-2.5">
        <h1 className="text-2xl font-semibold text-slate-800">
          {t("title")}
        </h1>
        <p className="text-[15px] text-gray-500">
          {t("description")}
        </p>
      </div>

      <Link
        href="/main"
        className="inline-flex items-center gap-1.5 text-[15px] font-medium text-gray-600 underline-offset-4 hover:text-teal-700 hover:underline transition-colors whitespace-nowrap"
      >
        <ChevronLeft size={16} />
        {t("backToMain")}
      </Link>
    </div>
  );
}
