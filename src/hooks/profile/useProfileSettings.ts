"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import type { UserIdentity } from "@supabase/supabase-js";
import { linkSocialIdentity, unlinkSocialIdentity } from "@/services/profile/profileSettings";
import { useAuthStore } from "@/store/authStore";
import { supabase } from "@/lib/supabase";

export const LANGUAGES = [
  { value: "ko", label: "한국어" },
  { value: "en", label: "English" },
  { value: "fil", label: "Filipino" },
];

export const SOCIAL_PROVIDERS: { key: "google" | "kakao" | "facebook" }[] = [
  { key: "google" },
  { key: "kakao" },
  { key: "facebook" },
];

type Notice = { type: "success" | "error"; text: string };

export function useProfileSettings(initialIdentities: UserIdentity[]) {
  const t = useTranslations("Profile.toast");
  const { user, setUser } = useAuthStore();

  const errorMessageByCode = (code: string | null | undefined) => {
    if (code === "identity_already_exists") return t("identityAlreadyExists");
    if (code === "same_identity") return t("sameIdentity");
    return null;
  };

  const [region, setRegion] = useState(user?.region ?? "");
  const [language, setLanguage] = useState("ko");
  const [identities, setIdentities] = useState<UserIdentity[]>(initialIdentities);
  const [notice, setNotice] = useState<Notice | null>(() => {
    if (typeof window === "undefined") return null;
    const params = new URLSearchParams(window.location.search);
    const errorCode = params.get("error_code");
    if (errorCode) {
      return { type: "error", text: errorMessageByCode(errorCode) ?? t("linkFailedCode", { code: errorCode }) };
    }
    const pending = sessionStorage.getItem("linkingProvider");
    if (pending && initialIdentities.some((i) => i.provider === pending)) {
      sessionStorage.removeItem("linkingProvider");
      return { type: "success", text: t("linkSuccess") };
    }
    return null;
  });

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("error_code")) {
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const handleSaveRegion = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("users")
      .update({ region: region || null })
      .eq("id", user.id)
      .select()
      .single();
    if (!error && data) {
      setUser(data);
      alert(t("regionSaved"));
    } else {
      alert(t("saveFailed"));
    }
  };

  const handleLink = async (provider: "google" | "kakao" | "facebook") => {
    sessionStorage.setItem("linkingProvider", provider);
    const { error } = await linkSocialIdentity(provider, window.location.href);
    if (error) {
      sessionStorage.removeItem("linkingProvider");
      setNotice({
        type: "error",
        text: errorMessageByCode(error.code) ?? t("linkFailedMessage", { message: error.message }),
      });
    }
  };

  const handleUnlink = async (provider: string) => {
    const identity = identities.find((i) => i.provider === provider);
    if (!identity) return;
    const { error } = await unlinkSocialIdentity(identity);
    if (!error) {
      setIdentities((prev) => prev.filter((i) => i.provider !== provider));
      setNotice({ type: "success", text: t("unlinkSuccess") });
    } else {
      setNotice({ type: "error", text: t("unlinkFailed") });
    }
  };

  return {
    region, setRegion,
    handleSaveRegion,
    language, setLanguage,
    identities,
    notice,
    handleLink,
    handleUnlink,
  };
}
