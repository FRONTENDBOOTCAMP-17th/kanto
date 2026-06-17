"use client";

import { MapPin, Globe, Link } from "lucide-react";
import { useTranslations } from "next-intl";
import { useProfileSettings, LANGUAGES, SOCIAL_PROVIDERS } from "@/hooks/profile/useProfileSettings";
import type { UserIdentity } from "@supabase/supabase-js";

function SocialIcon({ provider }: { provider: string }) {
  if (provider === "google") {
    return (
      <span className="w-7 h-7 rounded-lg border border-gray-200 bg-white flex items-center justify-center shrink-0">
        <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
      </span>
    );
  }
  if (provider === "kakao") {
    return (
      <span className="w-7 h-7 rounded-lg bg-[#FEE500] flex items-center justify-center shrink-0">
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="#3C1E1E" aria-hidden="true">
          <path d="M12 3C6.477 3 2 6.72 2 11.25c0 2.9 1.63 5.45 4.1 6.96L5.2 21l4.34-2.17c.79.16 1.6.25 2.46.25 5.523 0 10-3.72 10-8.25C22 6.72 17.523 3 12 3z" />
        </svg>
      </span>
    );
  }
  if (provider === "facebook") {
    return (
      <span className="w-7 h-7 rounded-lg bg-[#1877F2] flex items-center justify-center shrink-0">
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="white" aria-hidden="true">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      </span>
    );
  }
  return null;
}

export function ProfileSettingsSection({ initialIdentities }: { initialIdentities: UserIdentity[] }) {
  const {
    region, setRegion,
    language, setLanguage,
    identities,
    notice,
    handleLink,
    handleUnlink,
  } = useProfileSettings(initialIdentities);
  const t = useTranslations("Profile.settings");
  const tp = useTranslations("Profile.providers");

  return (
    <div className="flex flex-col divide-y divide-gray-100">
      {/* 지역 설정 */}
      <div className="px-5 md:px-0 py-6">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-2 mb-5">
            <MapPin className="w-4 h-4 text-gray-500" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-gray-900">{t("regionTitle")}</h2>
          </div>
          <p className="text-sm text-gray-400 mb-4">
            {t("regionDesc")}
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              placeholder="e.g. BGC, Taguig"
              aria-label={t("regionInputAria")}
              className="flex-1 px-3 py-2.5 text-sm text-gray-900 border border-gray-200 rounded-lg outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
            />
            <button
              type="button"
              className="cursor-pointer px-4 py-2.5 rounded-lg bg-teal-500 text-white text-sm font-medium hover:bg-teal-600 transition-colors"
            >
              {t("regionSet")}
            </button>
          </div>
        </div>
      </div>

      {/* 언어 설정 */}
      <div className="px-5 md:px-0 py-6">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-2 mb-5">
            <Globe className="w-4 h-4 text-gray-500" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-gray-900">{t("languageTitle")}</h2>
          </div>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            aria-label={t("languageSelectAria")}
            className="w-full px-3 py-2.5 text-sm text-gray-900 border border-gray-200 rounded-lg outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200 bg-white cursor-pointer"
          >
            {LANGUAGES.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 계정 연동 */}
      <div className="px-5 md:px-0 py-6">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-2 mb-5">
            <Link className="w-4 h-4 text-gray-500" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-gray-900">{t("linkTitle")}</h2>
          </div>
          {notice && (
            <div
              role="alert"
              aria-live="polite"
              className={`mb-4 px-3 py-2.5 rounded-lg text-sm ${notice.type === "success" ? "bg-teal-50 text-teal-700" : "bg-red-50 text-red-600"}`}
            >
              {notice.text}
            </div>
          )}
          <div className="flex flex-col gap-7">
            {SOCIAL_PROVIDERS.map(({ key }) => {
              const connected = identities.some((i) => i.provider === key);
              const canUnlink = identities.length > 1;
              const label = tp(key);
              return (
                <div key={key} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <SocialIcon provider={key} />
                    <span className="text-sm font-medium text-gray-900">{label}</span>
                  </div>
                  {connected ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-teal-600 bg-teal-50 px-2.5 py-1 rounded-2xl">
                        {t("connected")}
                      </span>
                      {canUnlink && (
                        <button
                          type="button"
                          onClick={() => handleUnlink(key)}
                          aria-label={t("unlinkAria", { provider: label })}
                          className="cursor-pointer text-xs font-medium text-gray-400 hover:text-red-500 transition-colors"
                        >
                          {t("unlink")}
                        </button>
                      )}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleLink(key)}
                      aria-label={t("linkAria", { provider: label })}
                      className="cursor-pointer text-xs font-medium text-gray-500 border border-gray-200 px-2.5 py-1 rounded-2xl hover:bg-gray-50 transition-colors"
                    >
                      {t("link")}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
