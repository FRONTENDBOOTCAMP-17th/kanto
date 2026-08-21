"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import ReportModal, {
  USER_REPORT_CATEGORIES,
} from "@/components/common/ReportModal";
import { GoToast } from "@/components/go/GoToast";
import { useGroupRoomData } from "./_hooks/useGroupRoomData";
import { useMemberModeration } from "./_hooks/useMemberModeration";
import { useRoomRead } from "./_components/Content/_hooks/useRoomRead";
import Skeleton from "./_components/Skeleton";
import Header from "./_components/Header";
import BlockModeModal from "./_components/BlockModeModal";
import Content from "./_components/Content";
import GroupMemberList from "../GroupMemberList";
import type { SellerInfo } from "@/type/user";

interface Props {
  meetupPostId: number;
  meetupTitle: string;
  currentUser: SellerInfo;
  onBack: () => void;
}

export default function GroupChatRoom({
  meetupPostId,
  meetupTitle,
  currentUser,
  onBack,
}: Props) {
  const t = useTranslations("Go");
  const [showMemberList, setShowMemberList] = useState(false);
  const [toast, setToast] = useState("");

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2600);
  };

  const {
    loaded,
    roomId,
    members,
    blockedIds: initialBlockedIds,
    initialMessages,
    initialHasMore,
    initialUnreadMessageId,
  } = useGroupRoomData(meetupPostId, currentUser);

  const { markCurrentRoomRead } = useRoomRead(roomId);

  const {
    blockedIds,
    reportTarget,
    closeReport,
    blockTarget,
    cancelBlock,
    handleReportUser,
    handleBlockUser,
    confirmBlock,
    handleUnblockUser,
  } = useMemberModeration({
    roomId,
    members,
    initialBlockedIds,
    onReportBlockedForDeletedUser: () => showToast(t("toast.withdrawn")),
    onBlocked: (mode) =>
      showToast(mode === "room" ? t("chat.blockedRoom") : t("chat.blockedGlobal")),
    onUnblocked: () => showToast(t("chat.unblocked")),
    onActionError: () => showToast(t("toast.error")),
  });

  const handleBack = async () => {
    await markCurrentRoomRead();
    onBack();
  };

  return (
    <div className="flex flex-col h-full w-full">
      <Header
        meetupTitle={meetupTitle}
        onBack={handleBack}
        onOpenMembers={() => setShowMemberList(true)}
      />

      {!loaded ? (
        <Skeleton />
      ) : roomId === null ? (
        <div className="flex-1 flex items-center justify-center text-sm text-gray-400 px-6 text-center">
          {t("chat.notFound")}
        </div>
      ) : (
        <Content
          roomId={roomId}
          currentUser={currentUser}
          blockedIds={blockedIds}
          initialMessages={initialMessages}
          initialHasMore={initialHasMore}
          initialUnreadMessageId={initialUnreadMessageId}
        />
      )}

      {showMemberList && (
        <GroupMemberList
          members={members}
          currentUserId={currentUser.id}
          blockedIds={blockedIds}
          onClose={() => setShowMemberList(false)}
          onReportUser={handleReportUser}
          onBlockUser={handleBlockUser}
          onUnblockUser={handleUnblockUser}
        />
      )}

      {blockTarget !== null && (
        <BlockModeModal onConfirm={confirmBlock} onCancel={cancelBlock} />
      )}

      <ReportModal
        isOpen={reportTarget !== null}
        onClose={closeReport}
        postId={reportTarget?.id ?? 0}
        userId={currentUser.id}
        initialReported={false}
        categories={USER_REPORT_CATEGORIES}
        targetType={reportTarget?.type ?? "user"}
        onToast={(msg) => showToast(msg)}
      />

      {toast && <GoToast message={toast} />}
    </div>
  );
}
