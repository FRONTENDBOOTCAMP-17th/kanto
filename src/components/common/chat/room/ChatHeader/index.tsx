"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft } from "lucide-react";
import type { SellerInfo } from "@/type/user";
import ReportModal, { USER_REPORT_CATEGORIES } from "@/components/common/ReportModal";
import Toast from "@/components/common/Toast";
import { leaveChatAction } from "../leaveChatAction";
import { useBottomToast } from "./_hooks/useBottomToast";
import { useUserBlock } from "./_hooks/useUserBlock";
import { useUserReport } from "./_hooks/useUserReport";
import HeaderMenu from "./_components/HeaderMenu";
import BlockConfirmModal from "./_components/BlockConfirmModal";

interface Props {
  partner: SellerInfo;
  postTitle: string;
  chatId: number;
  currentUserId: number;
  onBack: () => void;
  onLeave?: () => void;
  iBlocked?: boolean;
  onBlockChange?: () => void;
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
  iBlocked = false,
  onBlockChange,
  isReserved,
  onToggleReserve,
}: Props) {
  const t = useTranslations("Chat");
  const tr = useTranslations("Report");
  const router = useRouter();

  const {
    showToast,
    message: toastMessage,
    type: toastType,
    icon: toastIcon,
    showBottomToast,
  } = useBottomToast();

  const {
    showBlockConfirm,
    openBlockConfirm,
    closeBlockConfirm,
    isBlocking,
    handleBlock,
    handleUnblock,
  } = useUserBlock({
    partnerId: partner.id,
    onBlockChange,
    onError: () => showBottomToast(t("blockFailed"), "error", "x"),
  });

  const {
    showReport,
    closeReport,
    markReported,
    isCheckingReport,
    handleReportClick,
  } = useUserReport({
    partnerId: partner.id,
    currentUserId,
    onAlreadyReported: () => showBottomToast(tr("alreadyUser"), "error", "x"),
  });

  const handleOpenProfile = () => {
    router.push(`/user/${partner.id_token ?? partner.id}`);
  };

  const handleLeave = async () => {
    await leaveChatAction(chatId);
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

      <HeaderMenu
        isReserved={isReserved}
        onToggleReserve={onToggleReserve}
        isCheckingReport={isCheckingReport}
        onReportClick={handleReportClick}
        iBlocked={iBlocked}
        onBlock={openBlockConfirm}
        onUnblock={handleUnblock}
        onLeave={handleLeave}
      />

      <ReportModal
        isOpen={showReport}
        onClose={closeReport}
        postId={partner.id}
        userId={currentUserId}
        initialReported={false}
        categories={USER_REPORT_CATEGORIES}
        targetType="user"
        onReported={markReported}
        onToast={showBottomToast}
      />

      <Toast message={toastMessage} showMessage={showToast} type={toastType} icon={toastIcon} />

      {showBlockConfirm && (
        <BlockConfirmModal
          partnerName={partner.name}
          isBlocking={isBlocking}
          onConfirm={handleBlock}
          onCancel={closeBlockConfirm}
        />
      )}
    </div>
  );
}
