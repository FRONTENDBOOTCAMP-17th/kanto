import { useEffect } from "react";
import { useChatStore } from "@/store/chatStore";
import type { MyGroupRoom } from "@/type/groupChat";

export function useChatWidgetUnreadCount(
  groupRooms: MyGroupRoom[],
  currentUserId: number | null,
) {
  const chats = useChatStore((s) => s.chatList);
  const setUnreadCount = useChatStore((s) => s.setUnreadCount);

  useEffect(() => {
    if (!currentUserId) return;
    const directTotal = chats.reduce((acc, chat) => {
      const unread =
        currentUserId === chat.user_id_1
          ? (chat.user_id_1_unread ?? 0)
          : (chat.user_id_2_unread ?? 0);
      return acc + unread;
    }, 0);
    const groupTotal = groupRooms.reduce((acc, room) => acc + room.unread_count, 0);
    setUnreadCount(directTotal + groupTotal);
  }, [chats, groupRooms, currentUserId, setUnreadCount]);
}
