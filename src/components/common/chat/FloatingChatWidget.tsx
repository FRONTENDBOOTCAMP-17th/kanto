"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { useAuthStore } from "@/store/authStore";
import { useChatStore, type PendingNewChat, type PendingGroupRoom } from "@/store/chatStore";
import { useSuspended } from "@/hooks/useSuspended";
import { useChatListRealtime } from "@/hooks/chat/useChatListRealtime";
import { getMyRooms } from "@/services/go/groupChat";
import ChatBubbleButton from "./ChatBubbleButton";
import ChatList from "./chatPanel/ChatList";
import ChatRoom from "./chatPanel/room/ChatRoom";
import GroupChatRoomBody from "@/components/go/groupChat/GroupChatRoomBody";
import type { ChatWithUsers } from "@/type/chat/chat";
import type { MyGroupRoom } from "@/type/groupChat";

export default function FloatingChatWidget() {
  const t = useTranslations("Chat");
  const { isLoggedIn, user: authUser } = useAuthStore();
  const { isSuspended, openModal } = useSuspended();
  const setUnreadCount = useChatStore((s) => s.setUnreadCount);
  const groupRoomsVersion = useChatStore((s) => s.groupRoomsVersion);
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<"list" | "room" | "group-room">("list");
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
  const [pendingNewChatMeta, setPendingNewChatMeta] =
    useState<PendingNewChat | null>(null);
  const [selectedGroupRoom, setSelectedGroupRoom] = useState<PendingGroupRoom | null>(null);
  const [chats, setChats] = useState<ChatWithUsers[]>([]);
  const [groupRooms, setGroupRooms] = useState<MyGroupRoom[]>([]);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const refreshGroupRooms = () => {
    getMyRooms()
      .then(setGroupRooms)
      .catch(() => {});
  };

  useEffect(() => {
    return useChatStore.subscribe((state, prev) => {
      if (state.pendingChatId && state.pendingChatId !== prev.pendingChatId) {
        setIsOpen(true);
        setView("room");
        setSelectedChatId(state.pendingChatId);
        setPendingNewChatMeta(null);
        useChatStore.getState().clearPendingChat();
        fetch("/api/chat/list")
          .then((r) => r.json())
          .then((json) => {
            if (!json.error) setChats(json.chatList);
          });
      }
      if (
        state.pendingNewChat &&
        state.pendingNewChat !== prev.pendingNewChat
      ) {
        setIsOpen(true);
        setView("room");
        setSelectedChatId(null);
        setPendingNewChatMeta(state.pendingNewChat);
        useChatStore.getState().clearNewChat();
      }
      if (
        state.pendingGroupRoom &&
        state.pendingGroupRoom !== prev.pendingGroupRoom
      ) {
        setIsOpen(true);
        setView("group-room");
        setSelectedGroupRoom(state.pendingGroupRoom);
        useChatStore.getState().clearPendingGroupRoom();
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
    const el = panelRef.current;
    if (!el || !isOpen) return;
    const onWheel = (e: WheelEvent) => {
      const scrollable = (e.target as HTMLElement).closest<HTMLElement>(
        "[data-chat-scroll]",
      );
      if (scrollable) {
        const { scrollTop, scrollHeight, clientHeight } = scrollable;
        const atTop = e.deltaY < 0 && scrollTop <= 0;
        const atBottom =
          e.deltaY > 0 && scrollTop + clientHeight >= scrollHeight;
        if (!atTop && !atBottom) return;
      }
      e.preventDefault();
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
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

  useEffect(() => {
    if (!isLoggedIn) return;
    refreshGroupRooms();
  }, [isLoggedIn, groupRoomsVersion]);

  useChatListRealtime({ currentUserId: currentUserId ?? 0, setChats });

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

  if (!isLoggedIn) return null;

  const currentUserForRoom = authUser
    ? {
        id: authUser.id,
        name: authUser.name,
        avatar_url: authUser.avatar_url,
        created_at: authUser.created_at,
      }
    : null;

  return (
    <div className="flex flex-col items-end gap-2">
      {isOpen && (
        <div
          ref={panelRef}
          className="
          w-80 h-120 flex flex-col bg-white rounded-2xl shadow-2xl shadow-black/40 border border-gray-100 overflow-hidden
          md:w-80 md:h-120 md:rounded-2xl
          max-md:fixed max-md:inset-0 max-md:w-full max-md:h-full max-md:rounded-none max-md:shadow-none max-md:border-0 max-md:z-40
        "
        >
          {!currentUserId ? (
            <div className="flex items-center justify-center h-full text-sm text-gray-400">
              {t("loading")}
            </div>
          ) : view === "list" ? (
            <ChatList
              chats={chats}
              groupRooms={groupRooms}
              currentUserId={currentUserId}
              onChatSelect={(id) => {
                setSelectedChatId(id);
                setPendingNewChatMeta(null);
                setView("room");
              }}
              onGroupSelect={(meetupPostId, title) => {
                setSelectedGroupRoom({ meetupPostId, title });
                setView("group-room");
              }}
            />
          ) : view === "group-room" && selectedGroupRoom && currentUserForRoom ? (
            <GroupChatRoomBody
              meetupPostId={selectedGroupRoom.meetupPostId}
              meetupTitle={selectedGroupRoom.title}
              currentUser={currentUserForRoom}
              onBack={() => {
                setSelectedGroupRoom(null);
                setView("list");
                refreshGroupRooms();
              }}
            />
          ) : view === "room" &&
            (selectedChatId !== null || pendingNewChatMeta !== null) ? (
            <ChatRoom
              chatId={selectedChatId}
              newChatMeta={pendingNewChatMeta ?? undefined}
              currentUserOverride={currentUserForRoom ?? undefined}
              onBack={() => {
                if (selectedChatId !== null) {
                  setChats((prev) =>
                    prev.map((c) => {
                      if (c.id !== selectedChatId) return c;
                      return {
                        ...c,
                        user_id_1_unread:
                          c.user_id_1 === currentUserId
                            ? 0
                            : c.user_id_1_unread,
                        user_id_2_unread:
                          c.user_id_2 === currentUserId
                            ? 0
                            : c.user_id_2_unread,
                      };
                    }),
                  );
                }
                setPendingNewChatMeta(null);
                setView("list");
              }}
              onLeave={() => {
                setChats((prev) => prev.filter((c) => c.id !== selectedChatId));
                setPendingNewChatMeta(null);
                setView("list");
              }}
              onChatCreated={(newId) => {
                setSelectedChatId(newId);
                setPendingNewChatMeta(null);
              }}
            />
          ) : null}
        </div>
      )}
      <div className={view === "room" || view === "group-room" ? "max-md:hidden" : ""}>
        <ChatBubbleButton
          isOpen={isOpen}
          onToggle={() => {
            if (isSuspended) {
              openModal();
              return;
            }
            if (isOpen) {
              setView("list");
              setSelectedChatId(null);
              setPendingNewChatMeta(null);
              setSelectedGroupRoom(null);
            }
            setIsOpen((v) => !v);
          }}
        />
      </div>
    </div>
  );
}
