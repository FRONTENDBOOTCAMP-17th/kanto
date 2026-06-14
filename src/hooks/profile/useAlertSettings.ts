"use client";

import { useRef, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { updateAlertToggle, updateInterestCategories, updateAlertKeywords } from "@/services/profile/profileAlert";

export const CATEGORIES = [
  { key: "usedgoods", label: "중고거래" },
  { key: "jobs", label: "구인구직" },
  { key: "rental", label: "방렌트" },
  { key: "community", label: "커뮤니티" },
  { key: "dating", label: "랜덤채팅" },
];

export const ALL_KEYS = CATEGORIES.map((c) => c.key);
export const MAX_KEYWORDS = 5;

export type AlertSettings = {
  alert_chat: boolean;
  alert_comment: boolean;
  alert_post: boolean;
  interest_categories: string[] | null;
  alert_keywords: string[] | null;
};

type AlertField = "alert_chat" | "alert_comment" | "alert_post";

export function useAlertSettings(initial: AlertSettings) {
  const { user } = useAuthStore();
  const userId = user?.id;

  const [chatAlert, setChatAlert] = useState(initial.alert_chat);
  const [commentAlert, setCommentAlert] = useState(initial.alert_comment);
  const [postAlert, setPostAlert] = useState(initial.alert_post);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    initial.interest_categories ?? ALL_KEYS
  );
  const [keywords, setKeywords] = useState<string[]>(initial.alert_keywords ?? []);
  const [keywordInput, setKeywordInput] = useState("");
  const [showInput, setShowInput] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const toggleAlert = async (field: AlertField, next: boolean) => {
    if (!userId) return;
    if (field === "alert_chat") setChatAlert(next);
    else if (field === "alert_comment") setCommentAlert(next);
    else setPostAlert(next);
    await updateAlertToggle(userId, field, next);
  };

  const toggleCategory = async (key: string) => {
    if (!userId) return;
    const next = selectedCategories.includes(key)
      ? selectedCategories.filter((k) => k !== key)
      : [...selectedCategories, key];
    setSelectedCategories(next);
    const value = next.length === ALL_KEYS.length ? null : next;
    await updateInterestCategories(userId, value);
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
    await updateAlertKeywords(userId, next);
  };

  const removeKeyword = async (keyword: string) => {
    if (!userId) return;
    const next = keywords.filter((k) => k !== keyword);
    setKeywords(next);
    await updateAlertKeywords(userId, next.length > 0 ? next : null);
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
