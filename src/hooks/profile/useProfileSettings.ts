"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { UserIdentity } from "@supabase/supabase-js";

export const LANGUAGES = [
  { value: "ko", label: "한국어" },
  { value: "en", label: "English" },
  { value: "fil", label: "Filipino" },
];

export const SOCIAL_PROVIDERS: { key: "google" | "kakao" | "facebook"; label: string }[] = [
  { key: "google", label: "구글" },
  { key: "kakao", label: "카카오톡" },
  { key: "facebook", label: "페이스북" },
];

const ERROR_MESSAGES: Record<string, string> = {
  identity_already_exists: "이미 다른 계정에 연동된 소셜 계정입니다.",
  same_identity: "현재 계정에 이미 연동된 소셜 계정입니다.",
};

type Notice = { type: "success" | "error"; text: string };

export function useProfileSettings(initialIdentities: UserIdentity[]) {
  const [region, setRegion] = useState("");
  const [language, setLanguage] = useState("ko");
  const [identities, setIdentities] = useState<UserIdentity[]>(initialIdentities);
  const [notice, setNotice] = useState<Notice | null>(() => {
    if (typeof window === "undefined") return null;
    const params = new URLSearchParams(window.location.search);
    const errorCode = params.get("error_code");
    if (errorCode) {
      return { type: "error", text: ERROR_MESSAGES[errorCode] ?? `연결에 실패했습니다. (${errorCode})` };
    }
    const pending = sessionStorage.getItem("linkingProvider");
    if (pending && initialIdentities.some((i) => i.provider === pending)) {
      sessionStorage.removeItem("linkingProvider");
      return { type: "success", text: "소셜 계정이 연결되었습니다." };
    }
    return null;
  });

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("error_code")) {
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const handleLink = async (provider: "google" | "kakao" | "facebook") => {
    sessionStorage.setItem("linkingProvider", provider);
    const { error } = await supabase.auth.linkIdentity({
      provider,
      options: { redirectTo: window.location.href },
    });
    if (error) {
      sessionStorage.removeItem("linkingProvider");
      setNotice({
        type: "error",
        text: ERROR_MESSAGES[error.code ?? ""] ?? `연결에 실패했습니다: ${error.message}`,
      });
    }
  };

  const handleUnlink = async (provider: string) => {
    const identity = identities.find((i) => i.provider === provider);
    if (!identity) return;
    const { error } = await supabase.auth.unlinkIdentity(identity);
    if (!error) {
      setIdentities((prev) => prev.filter((i) => i.provider !== provider));
      setNotice({ type: "success", text: "소셜 계정 연결이 해제되었습니다." });
    } else {
      setNotice({ type: "error", text: "연결 해제에 실패했습니다." });
    }
  };

  return {
    region, setRegion,
    language, setLanguage,
    identities,
    notice,
    handleLink,
    handleUnlink,
  };
}
