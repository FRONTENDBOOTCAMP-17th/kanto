import { useState } from "react";
import { useRouter } from "next/navigation";
import { toggleReserveAction, sendReserveSystemMessageAction } from "../../../../../features/reserve/toggleReserveAction";

interface Params {
  postId: number;
  activeChatId: number | null;
  initialIsReserved: boolean;
  onError: (message: string) => void;
}

/** 게시물의 예약중 상태를 토글하고, 채팅방에 시스템 메시지로 알린다. */
export function useReserveToggle({ postId, activeChatId, initialIsReserved, onError }: Params) {
  const router = useRouter();
  const [isReserved, setIsReserved] = useState(initialIsReserved);

  const handleToggleReserve = async () => {
    const next = !isReserved;
    setIsReserved(next);
    try {
      await toggleReserveAction(postId, next);
      router.refresh();
    } catch {
      setIsReserved(!next);
      onError("예약 상태 변경에 실패했습니다.");
      return;
    }
    if (activeChatId !== null) {
      try {
        await sendReserveSystemMessageAction(postId, next, activeChatId);
      } catch {
        onError("채팅 알림 전송에 실패했습니다.");
      }
    }
  };

  return { isReserved, handleToggleReserve };
}
