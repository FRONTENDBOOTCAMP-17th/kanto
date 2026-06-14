"use client";

import { useEffect, useState } from "react";
import { Bell, Tag } from "lucide-react";
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

export function ProfileAlertsSection() {
  const { user } = useAuthStore();
  const [chatAlert, setChatAlert] = useState(true);
  const [commentAlert, setCommentAlert] = useState(true);
  const [postAlert, setPostAlert] = useState(false);
  const [selectedCategories, setSelectedCategories] =
    useState<string[]>(ALL_KEYS);

  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from("users")
      .select("interest_categories")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data?.interest_categories) {
          setSelectedCategories(data.interest_categories);
        }
      });
  }, [user?.id]);

  const toggleCategory = async (key: string) => {
    if (!user?.id) return;

    const next = selectedCategories.includes(key)
      ? selectedCategories.filter((k) => k !== key)
      : [...selectedCategories, key];

    setSelectedCategories(next);

    const value = next.length === ALL_KEYS.length ? null : next;
    await supabase
      .from("users")
      .update({ interest_categories: value })
      .eq("id", user.id);
  };

  const items = [
    {
      label: "채팅 알림",
      desc: "새 채팅 메시지 알림",
      value: chatAlert,
      onChange: setChatAlert,
    },
    {
      label: "댓글 알림",
      desc: "내 게시글에 댓글이 달리면 알림",
      value: commentAlert,
      onChange: setCommentAlert,
    },
    {
      label: "새 게시글 알림",
      desc: "관심 카테고리 새 게시글 알림",
      value: postAlert,
      onChange: setPostAlert,
    },
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
            {items.map(({ label, desc, value, onChange }) => (
              <div key={label} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={value}
                  onClick={() => onChange(!value)}
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
              <label
                key={key}
                className="flex items-center justify-between cursor-pointer"
              >
                <span className="text-sm font-medium text-gray-900">
                  {label}
                </span>
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
    </div>
  );
}
