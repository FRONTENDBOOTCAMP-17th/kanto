import { useState } from "react";
import {
  blockMemberInRoom,
  unblockMemberInRoom,
} from "@/services/go/groupChat";
import {
  blockUserStandaloneAction,
  unblockUserStandaloneAction,
} from "@/services/user/blockUser";
import type { MeetupParticipant } from "@/type/go";

interface Params {
  roomId: number | null;
  members: MeetupParticipant[];
  initialBlockedIds: Set<number>;
  onReportBlockedForDeletedUser: () => void;
  onBlocked: (mode: "room" | "global") => void;
  onUnblocked: () => void;
  onActionError: () => void;
}

/** 멤버 신고, 차단(방 전용/전역 2모드), 차단 해제와 차단목록 상태를 관리한다. */
export function useMemberModeration({
  roomId,
  members,
  initialBlockedIds,
  onReportBlockedForDeletedUser,
  onBlocked,
  onUnblocked,
  onActionError,
}: Params) {
  const [blockedIds, setBlockedIds] = useState(initialBlockedIds);
  const [reportTarget, setReportTarget] = useState<{
    id: number;
    type: "message" | "user";
  } | null>(null);
  const [blockTarget, setBlockTarget] = useState<number | null>(null);

  // 초기 로딩이 끝나 initialBlockedIds가 바뀌면(빈 Set → 실제 값) 렌더링 중 즉시 반영한다.
  // React 공식 문서가 권장하는 "prop 변화에 맞춰 state 조정" 패턴 — effect로 하면
  // set-state-in-effect 린트 경고와 불필요한 추가 렌더가 생긴다.
  const [prevInitialBlockedIds, setPrevInitialBlockedIds] = useState(initialBlockedIds);
  if (initialBlockedIds !== prevInitialBlockedIds) {
    setPrevInitialBlockedIds(initialBlockedIds);
    setBlockedIds(initialBlockedIds);
  }

  const handleReportUser = (userId: number) => {
    const member = members.find((m) => m.user_id === userId);
    if (member?.is_deleted) {
      onReportBlockedForDeletedUser();
      return;
    }
    setReportTarget({ id: userId, type: "user" });
  };

  const handleBlockUser = (userId: number) => {
    setBlockTarget(userId);
  };

  const confirmBlock = async (mode: "room" | "global") => {
    if (blockTarget === null || roomId === null) return;
    const userId = blockTarget;
    setBlockTarget(null);
    try {
      if (mode === "room") {
        await blockMemberInRoom(roomId, userId);
      } else {
        await blockUserStandaloneAction(userId);
      }
      setBlockedIds((prev) => new Set(prev).add(userId));
      onBlocked(mode);
    } catch {
      onActionError();
    }
  };

  const handleUnblockUser = async (userId: number) => {
    if (roomId === null) return;
    try {
      await Promise.all([
        unblockMemberInRoom(roomId, userId),
        unblockUserStandaloneAction(userId),
      ]);
      setBlockedIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
      onUnblocked();
    } catch {
      onActionError();
    }
  };

  return {
    blockedIds,
    reportTarget,
    closeReport: () => setReportTarget(null),
    blockTarget,
    cancelBlock: () => setBlockTarget(null),
    handleReportUser,
    handleBlockUser,
    confirmBlock,
    handleUnblockUser,
  };
}
