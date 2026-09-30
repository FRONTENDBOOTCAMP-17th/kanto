import { useCallback } from "react";
import { markRoomRead } from "@/services/go/groupChat";
import { useChatStore } from "@/store/chatStore";

/** 현재 그룹채팅방을 읽음 처리하고 채팅 목록의 안읽음 수를 갱신한다. */
export function useRoomRead(roomId: number | null) {
  const refreshGroupRoomsList = useChatStore((s) => s.refreshGroupRoomsList);

  const markCurrentRoomRead = useCallback(async () => {
    if (roomId === null) return;
    await markRoomRead(roomId);
    refreshGroupRoomsList();
  }, [refreshGroupRoomsList, roomId]);

  return { markCurrentRoomRead };
}
