import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import type { GroupMessage, GroupMessageWithSender } from "@/type/groupChat";
import type { SellerInfo } from "@/type/user";

interface Props {
  roomId: number | null;
  currentUser: SellerInfo;
  blockedIds: Set<number>;
  setMessages: React.Dispatch<React.SetStateAction<GroupMessageWithSender[]>>;
  onMessageInserted?: (message: GroupMessage) => void;
}

export function useGroupChatRealtime({
  roomId,
  currentUser,
  blockedIds,
  setMessages,
  onMessageInserted,
}: Props) {
  const senderCacheRef = useRef<Map<number, SellerInfo>>(new Map([[currentUser.id, currentUser]]));

  
  
  
  const blockedIdsRef = useRef(blockedIds);
  const setMessagesRef = useRef(setMessages);
  const onMessageInsertedRef = useRef(onMessageInserted);
  
  useEffect(() => {
    blockedIdsRef.current = blockedIds;
    setMessagesRef.current = setMessages;
    onMessageInsertedRef.current = onMessageInserted;
  });

  useEffect(() => {
    if (roomId === null) return;

    const channel = supabase
      .channel(`meetup-chat-room-${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "meetup_chat_messages",
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          const newMsg = payload.new as GroupMessage;
          onMessageInsertedRef.current?.(newMsg);

          if (newMsg.type !== "system" && newMsg.sender_id === currentUser.id) return;
          if (newMsg.type !== "system" && blockedIdsRef.current.has(newMsg.sender_id)) return;

          let sender = senderCacheRef.current.get(newMsg.sender_id);
          if (!sender) {
            const { data } = await supabase
              .from("users")
              .select("id, name, avatar_url, created_at")
              .eq("id", newMsg.sender_id)
              .single();
            if (!data) return;
            sender = data as SellerInfo;
            senderCacheRef.current.set(newMsg.sender_id, sender);
          }

          const msgWithSender: GroupMessageWithSender = { ...newMsg, sender };

          setMessagesRef.current((prev) =>
            prev.some((m) => m.id === newMsg.id) ? prev : [...prev, msgWithSender],
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, currentUser.id]);
}
