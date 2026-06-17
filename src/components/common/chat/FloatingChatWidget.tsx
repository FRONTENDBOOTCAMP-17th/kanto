"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import { useChatListRealtime } from "@/hooks/chat/useChatListRealtime";
import ChatBubbleButton from "./ChatBubbleButton";
import ChatList from "./chatPanel/ChatList";
import ChatRoom from "./chatPanel/room/ChatRoom";
import type { ChatWithUsers } from "@/type/chat/chat";

export default function FloatingChatWidget() {
  const { isLoggedIn } = useAuthStore();
  const setUnreadCount = useChatStore((s) => s.setUnreadCount);
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<"list" | "room">("list");
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
  const [chats, setChats] = useState<ChatWithUsers[]>([]);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  useEffect(() => {
    return useChatStore.subscribe((state, prev) => {
      if (state.pendingChatId && state.pendingChatId !== prev.pendingChatId) {
        setIsOpen(true);
        setView("room");
        setSelectedChatId(state.pendingChatId);
        useChatStore.getState().clearPendingChat();
        fetch("/api/chat/list")
          .then((r) => r.json())
          .then((json) => {
            if (!json.error) setChats(json.chatList);
          });
      }
    });
  }, []);

  useEffect(() => {
    if (isOpen && window.innerWidth < 768) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isLoggedIn) return;
    fetch("/api/chat/list")
      .then((r) => r.json())
      .then((json) => {
        if (json.error) return;
        setChats(json.chatList);
        setCurrentUserId(json.currentUserId);
      });
  }, [isLoggedIn]);

  useChatListRealtime({ currentUserId: currentUserId ?? 0, setChats });

  useEffect(() => {
    if (!currentUserId) return;
    const total = chats.reduce((acc, chat) => {
      const unread =
        currentUserId === chat.user_id_1
          ? (chat.user_id_1_unread ?? 0)
          : (chat.user_id_2_unread ?? 0);
      return acc + unread;
    }, 0);
    setUnreadCount(total);
  }, [chats, currentUserId, setUnreadCount]);

  if (!isLoggedIn) return null;

  return (
    <div className="flex flex-col items-end gap-2">
      {isOpen && (
        <div
          className="
          w-80 h-120 flex flex-col bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden
          md:w-80 md:h-120 md:rounded-2xl
          max-md:fixed max-md:inset-0 max-md:w-full max-md:h-full max-md:rounded-none max-md:shadow-none max-md:border-0 max-md:z-40
        "
        >
          {!currentUserId ? (
            <div className="flex items-center justify-center h-full text-sm text-gray-400">
              로딩중...
            </div>
          ) : view === "list" ? (
            <ChatList
              chats={chats}
              currentUserId={currentUserId}
              onChatSelect={(id) => {
                setSelectedChatId(id);
                setView("room");
              }}
            />
          ) : view === "room" && selectedChatId !== null ? (
            <ChatRoom
              chatId={selectedChatId}
              onBack={() => setView("list")}
              onLeave={() => {
                setChats((prev) => prev.filter((c) => c.id !== selectedChatId));
                setView("list")
              }}
            />
          ) : null}
        </div>
      )}
      <div className={view === "room" ? "max-md:hidden" : ""}>
        <ChatBubbleButton
          isOpen={isOpen}
          onToggle={() => {
            if (isOpen) {
              setView("list");
              setSelectedChatId(null);
            }
            setIsOpen((v) => !v);
          }}
        />
      </div>
    </div>
  );
}
