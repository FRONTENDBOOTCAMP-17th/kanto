"use client";

import { useState, useRef, useEffect } from "react";
import { MapPin, ChevronDown, ArrowRight, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { TRADE_LOCATIONS } from "@/type/location";

const LOCATION_IDS = ["all", ...TRADE_LOCATIONS] as const;

interface SearchBarProps {
  givenSearch?: string;
  defaultLocation?: string;
  onSearch?: (query: string, location: string) => void;
  showLocation?: boolean;
  children?: React.ReactNode;
}

export function SearchBar({ givenSearch = "", defaultLocation = "all", onSearch, showLocation = false, children }: SearchBarProps) {
  const t = useTranslations("Common");
  const te = useTranslations("Enums");
  const [searchInput, setSearchInput] = useState(givenSearch);
  const [locationFilter, setLocationFilter] = useState(defaultLocation);
  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);
  const [mobileLocationOpen, setMobileLocationOpen] = useState(false);
  const locationDropdownRef = useRef<HTMLDivElement>(null);

  const locationLabel = (id: string) =>
    id === "all"
      ? t("allRegions")
      : id === "그 외 지역"
        ? te("tradeLocation.otherAreas")
        : id;

  const selectedLocationLabel = locationLabel(locationFilter);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        locationDropdownRef.current &&
        !locationDropdownRef.current.contains(e.target as Node)
      ) {
        setLocationDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileLocationOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileLocationOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchInput, locationFilter);
  };

  return (
    <div className="mb-8">
      <form onSubmit={handleSubmit}>
        
        <div className="md:hidden space-y-2">
          {showLocation && (
            <button
              type="button"
              onClick={() => setMobileLocationOpen(true)}
              aria-expanded={mobileLocationOpen}
              aria-haspopup="dialog"
              className={`flex items-center gap-1.5 h-11 px-4 rounded-full border-2 transition-colors font-semibold text-sm whitespace-nowrap ${
                locationFilter !== "all"
                  ? "border-teal-400 bg-teal-50 text-teal-700"
                  : "border-gray-200 bg-white text-gray-800"
              }`}
            >
              <MapPin className="w-4 h-4 shrink-0" />
              <span>{selectedLocationLabel}</span>
              <ChevronDown className="w-4 h-4" />
            </button>
          )}

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
              className="cursor-pointer shrink-0 w-7 h-7 bg-gray-800 hover:bg-teal-500 rounded-full flex items-center justify-center transition-colors mr-0.5"
            >
              <ArrowRight className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
        </div>

        
        <div className="hidden md:flex items-center bg-white border-2 border-gray-200 rounded-full h-12 px-2 focus-within:border-teal-400 transition-colors max-w-lg mx-auto">
          {showLocation && <div className="relative shrink-0" ref={locationDropdownRef}>
            <button
              type="button"
              onClick={() => setLocationDropdownOpen((v) => !v)}
              aria-expanded={locationDropdownOpen}
              aria-haspopup="listbox"
              className={`flex items-center gap-1 px-3 h-8 rounded-full font-semibold text-sm whitespace-nowrap transition-colors select-none ${
                locationFilter !== "all"
                  ? "text-teal-700"
                  : "text-gray-800 hover:bg-gray-100"
              }`}
            >
              <MapPin className="w-4 h-4 shrink-0" />
              <span>{selectedLocationLabel}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-200 ${locationDropdownOpen ? "rotate-180" : ""}`}
              />
            </button>
            {locationDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-200 py-2 z-50">
                {LOCATION_IDS.map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setLocationFilter(id);
                      setLocationDropdownOpen(false);
                    }}
                    className={`dropdown-item ${
                      locationFilter === id
                        ? "bg-teal-50 text-teal-600 font-semibold"
                        : "text-gray-700"
                    }`}
                  >
                    {locationLabel(id)}
                  </button>
                ))}
              </div>
            )}
          </div>}

          {children && (
            <>
              <div className="w-px h-5 bg-gray-300 mx-1 shrink-0" />
              {children}
            </>
          )}

          <div className="w-px h-5 bg-gray-300 mx-1 shrink-0" />
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
            className="cursor-pointer shrink-0 w-8 h-8 bg-gray-800 hover:bg-teal-500 rounded-full flex items-center justify-center transition-colors mr-0.5"
          >
            <ArrowRight className="w-4 h-4 text-white" />
          </button>
        </div>
      </form>

      
      {showLocation && mobileLocationOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileLocationOpen(false)}
          />
          <div className="relative bg-white rounded-t-3xl w-full pb-8">
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-gray-300" />
            </div>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <span className="font-bold text-gray-900 text-lg">{t("selectRegion")}</span>
              <button
                type="button"
                onClick={() => setMobileLocationOpen(false)}
                aria-label={t("closeRegionSelect")}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="px-4 py-3">
              {LOCATION_IDS.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setLocationFilter(id);
                    setMobileLocationOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-5 py-4 rounded-xl mb-2 transition-colors ${
                    locationFilter === id
                      ? "bg-teal-50 text-teal-600"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <span
                    className={`text-base ${locationFilter === id ? "font-semibold" : ""}`}
                  >
                    {locationLabel(id)}
                  </span>
                  {locationFilter === id && (
                    <div className="w-5 h-5 rounded-full bg-teal-500 flex items-center justify-center">
                      <svg
                        className="w-3 h-3 text-white"
                        fill="none"
                        viewBox="0 0 12 12"
                      >
                        <path
                          d="M2 6l3 3 5-5"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
