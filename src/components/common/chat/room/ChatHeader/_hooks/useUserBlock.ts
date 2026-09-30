import { useState } from "react";
import {
  blockUserStandaloneAction,
  unblockUserStandaloneAction,
} from "@/services/user/blockUser";

interface Params {
  partnerId: number;
  onBlockChange?: () => void;
  onError: () => void;
}

/** 상대방 차단 확인 모달 상태와 차단·차단해제 동작을 관리한다. */
export function useUserBlock({ partnerId, onBlockChange, onError }: Params) {
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);

  const handleBlock = async () => {
    setIsBlocking(true);
    try {
      await blockUserStandaloneAction(partnerId);
      setShowBlockConfirm(false);
      onBlockChange?.();
    } catch {
      onError();
    } finally {
      setIsBlocking(false);
    }
  };

  const handleUnblock = async () => {
    try {
      await unblockUserStandaloneAction(partnerId);
      onBlockChange?.();
    } catch {
      onError();
    }
  };

  return {
    showBlockConfirm,
    openBlockConfirm: () => setShowBlockConfirm(true),
    closeBlockConfirm: () => setShowBlockConfirm(false),
    isBlocking,
    handleBlock,
    handleUnblock,
  };
}
