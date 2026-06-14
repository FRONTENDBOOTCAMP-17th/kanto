"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";

export const CATEGORIES = [
  { key: "usedgoods", label: "중고거래" },
  { key: "jobs", label: "구인구직" },
  { key: "rental", label: "방렌트" },
  { key: "community", label: "커뮤니티" },
  { key: "dating", label: "랜덤채팅" },
];

export const ALL_KEYS = CATEGORIES.map((c) => c.key);
export const MAX_KEYWORDS = 5;

type AlertField = "alert_chat" | "alert_comment" | "alert_post";

export function useAlertSettings() {
  const { user } = useAuthStore();
  const userId = user?.id;

  const [chatAlert, setChatAlert] = useState(true);
  const [commentAlert, setCommentAlert] = useState(true);
  const [postAlert, setPostAlert] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(ALL_KEYS);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState("");
  const [showInput, setShowInput] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!userId) return;
    supabase
      .from("users")
      .select("alert_chat, alert_comment, alert_post, interest_categories, alert_keywords")
      .eq("id", userId)
      .single()
      .then(({ data }) => {
        if (!data) return;
        if (data.alert_chat != null) setChatAlert(data.alert_chat);
        if (data.alert_comment != null) setCommentAlert(data.alert_comment);
        if (data.alert_post != null) setPostAlert(data.alert_post);
        if (data.interest_categories) setSelectedCategories(data.interest_categories);
        if (data.alert_keywords) setKeywords(data.alert_keywords);
      });
  }, [userId]);

  const toggleAlert = async (field: AlertField, next: boolean) => {
    if (!userId) return;
    if (field === "alert_chat") {
      setChatAlert(next);
      await supabase.from("users").update({ alert_chat: next }).eq("id", userId);
    } else if (field === "alert_comment") {
      setCommentAlert(next);
      await supabase.from("users").update({ alert_comment: next }).eq("id", userId);
    } else {
      setPostAlert(next);
      await supabase.from("users").update({ alert_post: next }).eq("id", userId);
    }
  };

  const toggleCategory = async (key: string) => {
    if (!userId) return;
    const next = selectedCategories.includes(key)
      ? selectedCategories.filter((k) => k !== key)
      : [...selectedCategories, key];
    setSelectedCategories(next);
    const value = next.length === ALL_KEYS.length ? null : next;
    await supabase.from("users").update({ interest_categories: value }).eq("id", userId);
  };

  const addKeyword = async () => {
    const trimmed = keywordInput.trim();
    if (!trimmed || !userId || keywords.includes(trimmed)) {
      setKeywordInput("");
      return;
    }
    const next = [...keywords, trimmed];
    setKeywords(next);
    setKeywordInput("");
    setShowInput(false);
    await supabase.from("users").update({ alert_keywords: next }).eq("id", userId);
  };

  const removeKeyword = async (keyword: string) => {
    if (!userId) return;
    const next = keywords.filter((k) => k !== keyword);
    setKeywords(next);
    await supabase.from("users").update({ alert_keywords: next.length > 0 ? next : null }).eq("id", userId);
  };

  const handleShowInput = () => {
    setShowInput(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleCancelInput = () => {
    setShowInput(false);
    setKeywordInput("");
  };

  return {
    chatAlert, commentAlert, postAlert,
    selectedCategories,
    keywords, keywordInput, setKeywordInput, showInput,
    inputRef,
    toggleAlert, toggleCategory,
    addKeyword, removeKeyword,
    handleShowInput, handleCancelInput,
  };
}
