import { useEffect, useState } from "react";
import { useChatStore } from "@/store/chatStore";

export function useChatListInit(isLoggedIn: boolean) {
  const setChats = useChatStore((s) => s.setChatList);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  useEffect(() => {
    if (!isLoggedIn) return;
    fetch("/api/chat/list")
      .then((r) => r.json())
      .then((json) => {
        if (json.error) return;
        setChats(json.chatList);
        setCurrentUserId(json.currentUserId);
      });
  }, [isLoggedIn, setChats]);

  return currentUserId;
}
