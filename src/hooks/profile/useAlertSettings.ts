"use client";

import { useRef, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import {
  updateAlertToggle,
  updateInterestCategories,
  updateAlertKeywords,
} from "@/services/profile/profileAlert";

export const CATEGORIES = [
  { key: "usedgoods" },
  { key: "jobs" },
  { key: "rental" },
  { key: "dating" },
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
    initial.interest_categories ?? ALL_KEYS,
  );
  const [keywords, setKeywords] = useState<string[]>(
    initial.alert_keywords ?? [],
  );
  const [keywordInput, setKeywordInput] = useState("");
  const [showInput, setShowInput] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const toggleAlert = async (field: AlertField, next: boolean) => {
    if (!userId) return;
    const prev = field === "alert_chat" ? chatAlert : field === "alert_comment" ? commentAlert : postAlert;
    if (field === "alert_chat") setChatAlert(next);
    else if (field === "alert_comment") setCommentAlert(next);
    else setPostAlert(next);
    const { error } = await updateAlertToggle(userId, field, next);
    if (error) {
      if (field === "alert_chat") setChatAlert(prev);
      else if (field === "alert_comment") setCommentAlert(prev);
      else setPostAlert(prev);
    }
  };

  const toggleCategory = async (key: string) => {
    if (!userId) return;
    const prev = selectedCategories;
    const next = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key];
    setSelectedCategories(next);
    const { error } = await updateInterestCategories(userId, next.length === ALL_KEYS.length ? null : next);
    if (error) setSelectedCategories(prev);
  };

  const addKeyword = async () => {
    const trimmed = keywordInput.trim();
    if (!trimmed || !userId || keywords.includes(trimmed)) {
      setKeywordInput("");
      return;
    }
    const prev = keywords;
    const next = [...prev, trimmed];
    setKeywords(next);
    setKeywordInput("");
    setShowInput(false);
    const { error } = await updateAlertKeywords(userId, next);
    if (error) setKeywords(prev);
  };

  const removeKeyword = async (keyword: string) => {
    if (!userId) return;
    const prev = keywords;
    const next = prev.filter((k) => k !== keyword);
    setKeywords(next);
    const { error } = await updateAlertKeywords(userId, next.length > 0 ? next : null);
    if (error) setKeywords(prev);
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
    chatAlert,
    commentAlert,
    postAlert,
    selectedCategories,
    keywords,
    keywordInput,
    setKeywordInput,
    showInput,
    inputRef,
    toggleAlert,
    toggleCategory,
    addKeyword,
    removeKeyword,
    handleShowInput,
    handleCancelInput,
  };
}
