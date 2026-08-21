"use client";

import { useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import { useSuspended } from "@/hooks/useSuspended";
import { useChatListRealtime } from "./_hooks/useChatListRealtime";
import { useChatListInit } from "./_hooks/useChatListInit";
import { useGroupRoomsPolling } from "./_hooks/useGroupRoomsPolling";
import { useChatWidgetUnreadCount } from "./_hooks/useChatWidgetUnreadCount";
import {
  useChatWidgetExternalOpenSync,
  useChatWidgetUrlRestore,
  useChatWidgetUrlSync,
  useChatWidgetDraftPersist,
} from "./_hooks/useChatWidgetDeepLink";
import { useChatWidgetPanelUX } from "./_hooks/useChatWidgetPanelUX";
import ChatBubbleButton from "./ChatBubbleButton";
import ChatList from "../list/ChatList";
import ChatRoom from "../room/ChatRoom";
import GroupChatRoom from "@/components/go/groupChat/GroupChatRoom";
import type { User } from "@/type/user";

export default function FloatingChatWidget({
  initialUser,
}: {
  initialUser: User | null;
}) {
  const t = useTranslations("Chat");

  const storeUser = useAuthStore((s) => s.user);
  const authUser = storeUser ?? initialUser;
  const isLoggedIn = !!authUser;
  const { isSuspended, openModal } = useSuspended();

  const isOpen = useChatStore((s) => s.isOpen);
  const setWidgetOpen = useChatStore((s) => s.setWidgetOpen);
  const view = useChatStore((s) => s.view);
  const setView = useChatStore((s) => s.setView);
  const selectedChatId = useChatStore((s) => s.selectedChatId);
  const setSelectedChatId = useChatStore((s) => s.setSelectedChatId);
  const pendingNewChatMeta = useChatStore((s) => s.newChatDraft);
  const setPendingNewChatMeta = useChatStore((s) => s.setNewChatDraft);
  const selectedGroupRoom = useChatStore((s) => s.activeGroupRoom);
  const setSelectedGroupRoom = useChatStore((s) => s.setActiveGroupRoom);
  const chats = useChatStore((s) => s.chatList);
  const setChats = useChatStore((s) => s.setChatList);

  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const currentUserId = useChatListInit(isLoggedIn);
  const { groupRooms, refreshGroupRooms } = useGroupRoomsPolling(isLoggedIn);
  useChatWidgetUnreadCount(groupRooms, currentUserId);
  useChatWidgetExternalOpenSync();
  useChatWidgetUrlRestore(isLoggedIn);
  useChatWidgetUrlSync();
  useChatWidgetDraftPersist();
  useChatListRealtime({ currentUserId: currentUserId ?? 0, setChats });

  const handleClose = useCallback(() => {
    setView("list");
    setSelectedChatId(null);
    setPendingNewChatMeta(null);
    setWidgetOpen(false);
  }, [setView, setSelectedChatId, setPendingNewChatMeta, setWidgetOpen]);

  useChatWidgetPanelUX(rootRef, panelRef, handleClose);

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
    <div ref={rootRef} className="relative">
      {isOpen && (
        <div
          ref={panelRef}
          className="
          absolute bottom-0 right-full mr-3
          w-80 h-120 flex flex-col bg-white rounded-2xl shadow-2xl shadow-black/40 border border-gray-100 overflow-hidden
          max-md:fixed max-md:inset-0 max-md:mr-0 max-md:w-full max-md:h-full max-md:rounded-none max-md:shadow-none max-md:border-0 max-md:z-40
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
            />
          ) : view === "group-room" && selectedGroupRoom && currentUserForRoom ? (
            <GroupChatRoom
              key={selectedGroupRoom.meetupPostId}
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
            />
          ) : null}
        </div>
      )}
      <div className={isOpen ? "max-md:hidden" : ""}>
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
            setWidgetOpen(!isOpen);
          }}
        />
      </div>
    </div>
  );
}
