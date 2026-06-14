"use client";

import { Bell, Tag, Plus, X } from "lucide-react";
import { useAlertSettings, CATEGORIES, MAX_KEYWORDS } from "@/hooks/profile/useAlertSettings";

const ALERT_ITEMS = [
  { label: "채팅 알림", desc: "새 채팅 메시지 알림", field: "alert_chat" as const },
  { label: "댓글 알림", desc: "내 게시글에 댓글이 달리면 알림", field: "alert_comment" as const },
  { label: "새 게시글 알림", desc: "관심 카테고리·키워드 새 게시글 알림", field: "alert_post" as const },
];

export function ProfileAlertsSection() {
  const {
    chatAlert, commentAlert, postAlert,
    selectedCategories,
    keywords, keywordInput, setKeywordInput, showInput,
    inputRef,
    toggleAlert, toggleCategory,
    addKeyword, removeKeyword,
    handleShowInput, handleCancelInput,
  } = useAlertSettings();

  const alertValues = { alert_chat: chatAlert, alert_comment: commentAlert, alert_post: postAlert };

  return (
    <div className="flex flex-col divide-y divide-gray-100">
      {/* 알림 토글 */}
      <div className="px-5 md:px-0 py-6">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-2 mb-5">
            <Bell className="w-4 h-4 text-gray-500" />
            <p className="text-lg font-semibold text-gray-900">알림 설정</p>
          </div>
          <div className="flex flex-col gap-5">
            {ALERT_ITEMS.map(({ label, desc, field }) => (
              <div key={field} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={alertValues[field]}
                  onClick={() => toggleAlert(field, !alertValues[field])}
                  className={`cursor-pointer relative w-11 h-6 rounded-full transition-colors duration-200 ${alertValues[field] ? "bg-teal-500" : "bg-gray-300"}`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${alertValues[field] ? "translate-x-5" : "translate-x-0"}`}
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
              <p className="text-sm text-gray-400 mb-5">선택한 카테고리의 새 게시글 알림을 받습니다.</p>
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
              <p className="text-sm text-gray-400 mb-4">키워드가 포함된 새 게시글이 올라오면 알림을 받습니다.</p>

              {keywords.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {keywords.map((kw) => (
                    <span key={kw} className="flex items-center gap-1 px-3 py-1 bg-teal-50 text-teal-700 text-sm rounded-full">
                      {kw}
                      <button type="button" onClick={() => removeKeyword(kw)} className="text-teal-400 hover:text-teal-600 cursor-pointer">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

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
                    <button type="button" onClick={addKeyword} disabled={!keywordInput.trim()} className="px-3 py-2 bg-teal-500 text-white text-sm rounded-lg hover:bg-teal-600 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
                      추가
                    </button>
                    <button type="button" onClick={handleCancelInput} className="px-3 py-2 text-gray-400 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                      취소
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={handleShowInput} className="flex items-center gap-1.5 text-sm text-teal-600 hover:text-teal-700 cursor-pointer">
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
