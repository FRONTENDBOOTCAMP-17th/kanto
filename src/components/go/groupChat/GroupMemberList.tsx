"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { useChatStore } from "@/store/chatStore";
import type { MeetupParticipant } from "@/type/go";

interface Props {
  members: MeetupParticipant[];
  currentUserId: number;
  blockedIds: Set<number>;
  onClose: () => void;
  onReportUser: (userId: number) => void;
  onBlockUser: (userId: number) => void;
  onUnblockUser: (userId: number) => void;
}

export default function GroupMemberList({
  members,
  currentUserId,
  blockedIds,
  onClose,
  onReportUser,
  onBlockUser,
  onUnblockUser,
}: Props) {
  const t = useTranslations("Go.chat");
  const router = useRouter();

  // 참여자 이름 클릭 → 공개 프로필로 이동(채팅 위젯은 닫는다). 본인/탈퇴 회원은 이동 안 함.
  const goToProfile = (m: MeetupParticipant) => {
    if (m.user_id === currentUserId || m.is_deleted) return;
    useChatStore.getState().closeWidget();
    router.push(`/user/${m.user_id}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-sm mx-4 max-h-[70vh] bg-white rounded-2xl shadow-xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <h2 className="text-base font-semibold text-gray-800">
            {t("membersTitle", { count: members.length })}
          </h2>
          <button onClick={onClose} aria-label={t("close")} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {members.map((m) => {
            const clickable = m.user_id !== currentUserId && !m.is_deleted;
            return (
              <div
                key={m.user_id}
                className="flex items-center gap-3 px-5 py-3 border-b border-gray-50 last:border-b-0"
              >
                <div className="w-9 h-9 rounded-full bg-teal-500 flex items-center justify-center text-white font-semibold text-sm shrink-0">
                  {m.display_name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={() => goToProfile(m)}
                    disabled={!clickable}
                    aria-label={clickable ? t("viewProfile", { name: m.display_name }) : undefined}
                    className={`text-sm font-medium text-gray-900 text-left truncate max-w-full ${
                      clickable ? "hover:underline cursor-pointer" : "cursor-default"
                    }`}
                  >
                    {m.display_name}
                  </button>
                  {m.user_id === currentUserId && (
                    <span className="ml-1.5 inline-flex items-center rounded-full border border-teal-200 bg-teal-50 px-1.5 py-0.5 align-middle text-[10px] font-bold leading-none text-teal-700">
                      {t("me")}
                    </span>
                  )}
                  {m.is_host && (
                    <span className="ml-1.5 text-xs text-teal-600 font-medium">{t("host")}</span>
                  )}
                </div>
                {m.user_id !== currentUserId && (
                  <div className="flex gap-1.5 shrink-0">
                    {blockedIds.has(m.user_id) ? (
                      <button
                        onClick={() => onUnblockUser(m.user_id)}
                        className="text-xs text-teal-600 px-2 py-1 rounded-md hover:bg-teal-50 transition-colors"
                      >
                        {t("unblock")}
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => onReportUser(m.user_id)}
                          className="text-xs text-red-500 px-2 py-1 rounded-md hover:bg-red-50 transition-colors"
                        >
                          {t("report")}
                        </button>
                        <button
                          onClick={() => onBlockUser(m.user_id)}
                          className="text-xs text-gray-600 px-2 py-1 rounded-md hover:bg-gray-100 transition-colors"
                        >
                          {t("block")}
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
