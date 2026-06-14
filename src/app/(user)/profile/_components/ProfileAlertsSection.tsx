"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, Tag, Plus, X } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { supabase } from "@/lib/supabase";

const CATEGORIES = [
  { key: "usedgoods", label: "중고거래" },
  { key: "jobs", label: "구인구직" },
  { key: "rental", label: "방렌트" },
  { key: "community", label: "커뮤니티" },
  { key: "dating", label: "랜덤채팅" },
];

const ALL_KEYS = CATEGORIES.map((c) => c.key);
const MAX_KEYWORDS = 5;

export function ProfileAlertsSection() {
  const { user } = useAuthStore();
  const [chatAlert, setChatAlert] = useState(true);
  const [commentAlert, setCommentAlert] = useState(true);
  const [postAlert, setPostAlert] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(ALL_KEYS);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState("");
  const [showInput, setShowInput] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from("users")
      .select("alert_chat, alert_comment, alert_post, interest_categories, alert_keywords")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (!data) return;
        if (data.alert_chat != null) setChatAlert(data.alert_chat);
        if (data.alert_comment != null) setCommentAlert(data.alert_comment);
        if (data.alert_post != null) setPostAlert(data.alert_post);
        if (data.interest_categories) setSelectedCategories(data.interest_categories);
        if (data.alert_keywords) setKeywords(data.alert_keywords);
      });
  }, [user?.id]);

  const toggleCategory = async (key: string) => {
    if (!user?.id) return;
    const next = selectedCategories.includes(key)
      ? selectedCategories.filter((k) => k !== key)
      : [...selectedCategories, key];
    setSelectedCategories(next);
    const value = next.length === ALL_KEYS.length ? null : next;
    await supabase.from("users").update({ interest_categories: value }).eq("id", user.id);
  };

  const addKeyword = async () => {
    const trimmed = keywordInput.trim();
    if (!trimmed || !user?.id || keywords.includes(trimmed)) {
      setKeywordInput("");
      return;
    }
    const next = [...keywords, trimmed];
    setKeywords(next);
    setKeywordInput("");
    setShowInput(false);
    await supabase.from("users").update({ alert_keywords: next }).eq("id", user.id);
  };

  const removeKeyword = async (keyword: string) => {
    if (!user?.id) return;
    const next = keywords.filter((k) => k !== keyword);
    setKeywords(next);
    await supabase.from("users").update({ alert_keywords: next.length > 0 ? next : null }).eq("id", user.id);
  };

  const handleShowInput = () => {
    setShowInput(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const toggleAlert = async (field: "alert_chat" | "alert_comment" | "alert_post", next: boolean) => {
    if (!user?.id) return;
    if (field === "alert_chat") {
      setChatAlert(next);
      await supabase.from("users").update({ alert_chat: next }).eq("id", user.id);
    } else if (field === "alert_comment") {
      setCommentAlert(next);
      await supabase.from("users").update({ alert_comment: next }).eq("id", user.id);
    } else {
      setPostAlert(next);
      await supabase.from("users").update({ alert_post: next }).eq("id", user.id);
    }
  };

  const items = [
    { label: "채팅 알림", desc: "새 채팅 메시지 알림", value: chatAlert, field: "alert_chat" as const },
    { label: "댓글 알림", desc: "내 게시글에 댓글이 달리면 알림", value: commentAlert, field: "alert_comment" as const },
    { label: "새 게시글 알림", desc: "관심 카테고리·키워드 새 게시글 알림", value: postAlert, field: "alert_post" as const },
  ];

  return (
    <div className="flex flex-col divide-y divide-gray-100">
      {/* 알림 설정 */}
      <div className="px-5 md:px-0 py-6">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-2 mb-5">
            <Bell className="w-4 h-4 text-gray-500" />
            <p className="text-lg font-semibold text-gray-900">알림 설정</p>
          </div>
          <div className="flex flex-col gap-5">
            {items.map(({ label, desc, value, field }) => (
              <div key={label} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={value}
                  onClick={() => toggleAlert(field, !value)}
                  className={`cursor-pointer relative w-11 h-6 rounded-full transition-colors duration-200 ${value ? "bg-teal-500" : "bg-gray-300"}`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${value ? "translate-x-5" : "translate-x-0"}`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {postAlert && (
        <>
          {/* 관심 카테고리 */}
          <div className="px-5 md:px-0 py-6">
            <div className="max-w-md mx-auto">
              <div className="flex items-center gap-2 mb-2">
                <Tag className="w-4 h-4 text-gray-500" />
                <p className="text-lg font-semibold text-gray-900">관심 카테고리</p>
              </div>
              <p className="text-sm text-gray-400 mb-5">
                선택한 카테고리의 새 게시글 알림을 받습니다.
              </p>
              <div className="flex flex-col gap-3">
                {CATEGORIES.map(({ key, label }) => (
                  <label key={key} className="flex items-center justify-between cursor-pointer">
                    <span className="text-sm font-medium text-gray-900">{label}</span>
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(key)}
                      onChange={() => toggleCategory(key)}
                      className="w-4 h-4 accent-teal-500 cursor-pointer"
                    />
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* 키워드 알림 */}
          <div className="px-5 md:px-0 py-6">
            <div className="max-w-md mx-auto">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-gray-500" />
                  <p className="text-lg font-semibold text-gray-900">키워드 알림</p>
                </div>
                <span className="text-xs text-gray-400">{keywords.length} / {MAX_KEYWORDS}</span>
              </div>
              <p className="text-sm text-gray-400 mb-4">
                키워드가 포함된 새 게시글이 올라오면 알림을 받습니다.
              </p>

              {/* 등록된 키워드 태그 */}
              {keywords.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {keywords.map((kw) => (
                    <span
                      key={kw}
                      className="flex items-center gap-1 px-3 py-1 bg-teal-50 text-teal-700 text-sm rounded-full"
                    >
                      {kw}
                      <button
                        type="button"
                        onClick={() => removeKeyword(kw)}
                        className="text-teal-400 hover:text-teal-600 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* 키워드 입력 */}
              {keywords.length < MAX_KEYWORDS && (
                showInput ? (
                  <div className="flex gap-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addKeyword()}
                      placeholder="키워드 입력 (예: 맥북)"
                      className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-teal-400"
                    />
                    <button
                      type="button"
                      onClick={addKeyword}
                      disabled={!keywordInput.trim()}
                      className="px-3 py-2 bg-teal-500 text-white text-sm rounded-lg hover:bg-teal-600 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      추가
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowInput(false); setKeywordInput(""); }}
                      className="px-3 py-2 text-gray-400 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      취소
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleShowInput}
                    className="flex items-center gap-1.5 text-sm text-teal-600 hover:text-teal-700 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    키워드 추가
                  </button>
                )
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
