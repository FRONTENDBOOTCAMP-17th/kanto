"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";

interface SearchBarProps {
  givenSearch?: string;
  onSearch?: (query: string) => void;
  children?: React.ReactNode;
  className?: string;
}

export function SearchBar({
  givenSearch = "",
  onSearch,
  children,
  className,
}: SearchBarProps) {
  const t = useTranslations("Common");
  const [searchInput, setSearchInput] = useState(givenSearch);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchInput);
  };

  return (
    <div className={className ?? "mb-8"}>
      <form onSubmit={handleSubmit}>
        <div className="md:hidden">
          <div className="flex items-center bg-white border-2 border-gray-200 rounded-full h-11 px-2 focus-within:border-teal-400 transition-colors">
            {children && (
              <>
                {children}
                <div className="w-px h-5 bg-gray-300 mx-1 shrink-0" />
              </>
            )}
            <input
              type="text"
              aria-label={t("searchInputLabel")}
              placeholder={t("searchPlaceholder")}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="min-w-0 flex-1 h-full bg-transparent outline-none text-gray-700 placeholder-gray-400 px-2 text-sm"
            />
            <button
              type="submit"
              aria-label={t("search")}
              className="cursor-pointer shrink-0 w-7 h-7 bg-gray-800 hover:bg-teal-500 rounded-full flex items-center justify-center transition-colors mr-0.5 active:scale-100"
            >
              <ArrowRight className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
        </div>

        <div className="hidden md:flex items-center bg-white border-2 border-gray-200 rounded-full h-12 px-2 focus-within:border-teal-400 transition-colors max-w-xl mx-auto">
          {children && (
            <>
              {children}
              <div className="w-px h-5 bg-gray-300 mx-1 shrink-0" />
            </>
          )}
          <input
            type="text"
            aria-label={t("searchInputLabel")}
            placeholder={t("searchPlaceholder")}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="min-w-0 flex-1 h-full bg-transparent outline-none text-gray-700 placeholder-gray-400 px-2 text-sm"
          />
          <button
            type="submit"
            aria-label={t("search")}
            className="cursor-pointer shrink-0 w-8 h-8 bg-gray-800 hover:bg-teal-500 rounded-full flex items-center justify-center transition-colors mr-0.5 active:scale-100"
          >
            <ArrowRight className="w-4 h-4 text-white" />
          </button>
        </div>
      </form>
    </div>
  );
}
