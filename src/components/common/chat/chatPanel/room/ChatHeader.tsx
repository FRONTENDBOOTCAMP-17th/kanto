"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft, MoreVertical } from "lucide-react";
import type { SellerInfo } from "@/type/user";
import { useClickOutside } from "@/hooks/useClickOutside";
import ReportModal, { USER_REPORT_CATEGORIES } from "@/components/common/ReportModal";
import { leaveChatAction } from "./leaveChatAction";
import { blockUserAction } from "./blockUserAction";

interface Props {
  partner: SellerInfo;
  postTitle: string;
  chatId: number;
  currentUserId: number;
  onBack: () => void;
  onLeave?: () => void;
  isReserved?: boolean;
  onToggleReserve?: () => void;
}

export default function ChatHeader({
  partner,
  postTitle,
  chatId,
  currentUserId,
  onBack,
  onLeave,
  isReserved,
  onToggleReserve,
}: Props) {
  const t = useTranslations("Chat");
  const tc = useTranslations("Common");
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useClickOutside(menuRef, () => setMenuOpen(false));

  const handleOpenProfile = () => {
    router.push(`/user/${partner.id}`);
  };

  const handleLeave = async () => {
    await leaveChatAction(chatId);
    onLeave?.();
  };

  const handleBlock = async () => {
    setIsBlocking(true);
    await blockUserAction(chatId, partner.id);
    setShowBlockConfirm(false);
    onLeave?.();
  };

  return (
    <div className="bg-teal-500 px-4 py-3 md:px-3 md:py-2.5 flex items-center gap-2 relative shrink-0">
      <button
        onClick={onBack}
        aria-label={t("back")}
        className="text-white p-1 rounded-full hover:bg-teal-600 transition-colors shrink-0"
      >
        <ArrowLeft className="w-5 h-5 md:w-4 md:h-4" />
      </button>

      <button
        type="button"
        onClick={handleOpenProfile}
        aria-label={t("viewProfile", { name: partner.name })}
        className="flex items-center gap-2 flex-1 min-w-0 text-left rounded-lg px-1 py-0.5 -mx-1 hover:bg-teal-600/50 transition-colors cursor-pointer"
      >
        <div className="w-10 h-10 md:w-8 md:h-8 rounded-full bg-teal-400 flex items-center justify-center text-white font-semibold text-sm shrink-0">
          {partner.avatar_url ? (
            <Image
              src={partner.avatar_url}
              alt={partner.name ?? ""}
              width={40}
              height={40}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            partner.name[0]
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm md:text-xs leading-tight truncate">
            {partner.name}
          </p>
          <p className="text-teal-100 text-xs md:text-[10px] truncate">
            {postTitle}
          </p>
        </div>
      </button>

      <div ref={menuRef} className="relative">
        <button
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label={t("moreMenu")}
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          className="text-white p-1 rounded-full hover:bg-teal-600 transition-colors"
        >
          <MoreVertical className="w-5 h-5" />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-9 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden w-36 z-10">
            {onToggleReserve !== undefined && (
              <button
                onClick={() => { onToggleReserve(); setMenuOpen(false); }}
                className="w-full text-left px-4 py-3 text-sm text-teal-600 hover:bg-gray-50 transition-colors"
              >
                {isReserved ? t("cancelReserve") : t("setReserve")}
              </button>
            )}
            <button
              onClick={() => { setShowReport(true); setMenuOpen(false); }}
              className={`w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-gray-50 transition-colors ${onToggleReserve !== undefined ? "border-t border-gray-100" : ""}`}
            >
              {t("report")}
            </button>
            <button
              onClick={() => { setShowBlockConfirm(true); setMenuOpen(false); }}
              className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-t border-gray-100"
            >
              {t("block")}
            </button>
            <button
              onClick={handleLeave}
              className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-t border-gray-100"
            >
              {t("leave")}
            </button>
          </div>
        )}
      </div>

      <ReportModal
        isOpen={showReport}
        onClose={() => setShowReport(false)}
        postId={partner.id}
        userId={currentUserId}
        initialReported={false}
        categories={USER_REPORT_CATEGORIES}
        targetType="user"
      />

      {showBlockConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setShowBlockConfirm(false)}
        >
          <div
            className="w-full max-w-sm mx-4 bg-white rounded-2xl shadow-xl p-6 flex flex-col gap-5 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-base font-semibold text-gray-800">
              {t("blockConfirmMessage", { name: partner.name })}
            </p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => setShowBlockConfirm(false)}
                className="flex-1 py-2.5 rounded-full border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {tc("cancel")}
              </button>
              <button
                onClick={handleBlock}
                disabled={isBlocking}
                className="flex-1 py-2.5 rounded-full bg-red-500 hover:bg-red-600 text-sm font-medium text-white transition-colors disabled:opacity-50"
              >
                {tc("confirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
