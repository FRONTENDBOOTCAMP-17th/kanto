"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowRight, ChevronDown, X } from "lucide-react";

const CATEGORIES = [
  { id: "usedgoods", catKey: "usedgoods", path: "/usedgoods" },
  { id: "job",       catKey: "jobs",      path: "/job" },
  { id: "rental",    catKey: "rental",    path: "/rental" },
] as const;

type Category = (typeof CATEGORIES)[number];

export default function MainSearchBar() {
  const t = useTranslations("Main");
  const tc = useTranslations("Common");
  const [searchInput, setSearchInput] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category>(CATEGORIES[0]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    document.body.style.overflow = bottomSheetOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [bottomSheetOpen]);

  const handleSubmit = (e: { preventDefault(): void }) => {
    e.preventDefault();
    const query = searchInput.trim();
    router.push(query ? `${selectedCategory.path}?search=${encodeURIComponent(query)}` : selectedCategory.path);
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center bg-white border-2 border-gray-200 rounded-full h-11 md:h-14 px-2 focus-within:border-teal-400 transition-colors">

          
          <button
            type="button"
            onClick={() => setBottomSheetOpen(true)}
            aria-expanded={bottomSheetOpen}
            aria-haspopup="dialog"
            className="md:hidden flex items-center gap-1 px-3 h-8 rounded-full font-semibold text-sm whitespace-nowrap transition-colors select-none hover:bg-gray-100"
          >
            <span>{t(`category.${selectedCategory.catKey}`)}</span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
          </button>

          
          <div className="hidden md:block relative shrink-0" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen((v) => !v)}
              aria-expanded={dropdownOpen}
              aria-haspopup="listbox"
              className="flex items-center gap-1 px-3 h-8 rounded-full font-semibold text-sm whitespace-nowrap transition-colors select-none hover:bg-gray-100"
            >
              <span>{t(`category.${selectedCategory.catKey}`)}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {dropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-32 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => { setSelectedCategory(cat); setDropdownOpen(false); }}
                    className={`dropdown-item ${
                      selectedCategory.id === cat.id ? "bg-teal-50 text-teal-600 font-semibold" : "text-gray-700"
                    }`}
                  >
                    {t(`category.${cat.catKey}`)}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="w-px h-5 bg-gray-300 mx-1 shrink-0" />
          <input
            type="text"
            aria-label={tc("searchInputLabel")}
            placeholder={tc("searchPlaceholder")}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="min-w-0 flex-1 h-full bg-transparent outline-none text-gray-700 placeholder-gray-400 px-2 text-sm"
          />
          <button
            type="submit"
            aria-label={tc("search")}
            className="cursor-pointer shrink-0 w-7 h-7 md:w-8 md:h-8 bg-gray-800 hover:bg-teal-500 rounded-full flex items-center justify-center transition-colors mr-0.5"
          >
            <ArrowRight className="w-3.5 h-3.5 md:w-4 md:h-4 text-white" />
          </button>
        </div>
      </form>

      
      {bottomSheetOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setBottomSheetOpen(false)} />
          <div className="relative bg-white rounded-t-3xl w-full pb-8">
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-gray-300" />
            </div>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <span className="font-bold text-gray-900 text-lg">{t("categorySelect")}</span>
              <button
                type="button"
                onClick={() => setBottomSheetOpen(false)}
                aria-label={t("categorySelectClose")}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="px-4 py-3">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => { setSelectedCategory(cat); setBottomSheetOpen(false); }}
                  className={`w-full flex items-center justify-between px-5 py-4 rounded-xl mb-2 transition-colors ${
                    selectedCategory.id === cat.id ? "bg-teal-50 text-teal-600" : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <span className={`text-base ${selectedCategory.id === cat.id ? "font-semibold" : ""}`}>
                    {t(`category.${cat.catKey}`)}
                  </span>
                  {selectedCategory.id === cat.id && (
                    <div className="w-5 h-5 rounded-full bg-teal-500 flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
