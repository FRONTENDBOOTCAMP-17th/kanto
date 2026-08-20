"use client";

import { lockScroll, unlockScroll } from "@/utils/lockScroll";
import { useCallback, useState, useEffect, useLayoutEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { useAuthStore } from "@/store/authStore";
import { useChatStore, type PendingNewChat } from "@/store/chatStore";
import { useSuspended, useSuspendedModalStore } from "@/hooks/useSuspended";
import { useChatListRealtime } from "./_hooks/useChatListRealtime";
import { useGroupRoomsRealtime } from "@/hooks/go/useGroupRoomsRealtime";
import { getMyRooms } from "@/services/go/groupChat";
import ChatBubbleButton from "./ChatBubbleButton";
import ChatList from "../list/ChatList";
import ChatRoom from "../room/ChatRoom";
import GroupChatRoomBody from "@/components/go/groupChat/GroupChatRoomBody";
import type { MyGroupRoom } from "@/type/groupChat";
import type { User } from "@/type/user";

const NEW_CHAT_DRAFT_KEY = "chatWidget:newChatDraft";

const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

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
  const setUnreadCount = useChatStore((s) => s.setUnreadCount);
  const groupRoomsVersion = useChatStore((s) => s.groupRoomsVersion);
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
  const [groupRooms, setGroupRooms] = useState<MyGroupRoom[]>([]);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const refreshGroupRooms = useCallback(() => {
    getMyRooms()
      .then(setGroupRooms)
      .catch(() => {});
  }, []);

  
  
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debouncedRefreshGroupRooms = useCallback(() => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    refreshTimerRef.current = setTimeout(refreshGroupRooms, 400);
  }, [refreshGroupRooms]);
  useEffect(
    () => () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    },
    [],
  );
  const handleClose = useCallback(() => {
    setView("list");
    setSelectedChatId(null);
    setPendingNewChatMeta(null);
    setWidgetOpen(false);
  }, [setView, setSelectedChatId, setPendingNewChatMeta, setWidgetOpen]);

  useEffect(() => {
    return useChatStore.subscribe((state, prev) => {
      if (state.pendingChatId && state.pendingChatId !== prev.pendingChatId) {
        useChatStore.getState().setWidgetOpen(true);
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
        useChatStore.getState().setWidgetOpen(true);
        setView("room");
        setSelectedChatId(null);
        setPendingNewChatMeta(state.pendingNewChat);
        useChatStore.getState().clearNewChat();
      }
      if (
        state.pendingGroupRoom &&
        state.pendingGroupRoom !== prev.pendingGroupRoom
      ) {
        useChatStore.getState().setWidgetOpen(true);
        setView("group-room");
        setSelectedGroupRoom(state.pendingGroupRoom);
        useChatStore.getState().clearPendingGroupRoom();
      }
    });
  }, [setView, setSelectedChatId, setPendingNewChatMeta, setSelectedGroupRoom, setChats]);

  useEffect(() => {
    if (isOpen && window.innerWidth < 768) {
      lockScroll();
      return () => { unlockScroll(); };
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const onPointerDown = (e: PointerEvent) => {
      const target = e.target;
      if (!(target instanceof Node)) return;
      if (rootRef.current?.contains(target)) return;
      if (
        target instanceof Element &&
        target.closest("[data-radix-popper-content-wrapper], [data-radix-portal]")
      ) {
        return;
      }

      handleClose();
    };

    document.addEventListener("pointerdown", onPointerDown, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
    };
  }, [handleClose, isOpen]);

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
  }, [isLoggedIn, setChats]);

  useEffect(() => {
    if (!isLoggedIn) return;
    refreshGroupRooms();
  }, [isLoggedIn, groupRoomsVersion, refreshGroupRooms]);

  useEffect(() => {
    if (!isLoggedIn || !isOpen || view !== "list") return;
    refreshGroupRooms();
  }, [isLoggedIn, isOpen, refreshGroupRooms, view]);

  
  
  useEffect(() => {
    if (!isLoggedIn || !isOpen || view !== "list") return;
    const refreshIfVisible = () => {
      if (document.visibilityState === "visible") refreshGroupRooms();
    };
    const id = window.setInterval(refreshIfVisible, 10000);
    document.addEventListener("visibilitychange", refreshIfVisible);
    window.addEventListener("focus", refreshGroupRooms);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", refreshIfVisible);
      window.removeEventListener("focus", refreshGroupRooms);
    };
  }, [isLoggedIn, isOpen, refreshGroupRooms, view]);

  useChatListRealtime({ currentUserId: currentUserId ?? 0, setChats });
  
  useGroupRoomsRealtime(isLoggedIn, debouncedRefreshGroupRooms);

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

  
  
  
  const restoredRef = useRef(false);
  useIsoLayoutEffect(() => {
    if (restoredRef.current || !isLoggedIn) return;
    restoredRef.current = true;

    
    
    
    const chatParam = new URLSearchParams(window.location.search).get("chat");


    if (chatParam === "list") {
      setView("list");
      setSelectedChatId(null);
      setPendingNewChatMeta(null);
      setWidgetOpen(true);
      return;
    }

    const openChat = (chatId: number) => {
      const until = useAuthStore.getState().user?.suspended_until;
      if (until && new Date(until) > new Date()) {
        useSuspendedModalStore.getState().open();
        return;
      }
      setSelectedChatId(chatId);
      setPendingNewChatMeta(null);
      setView("room");
      setWidgetOpen(true);
    };

    if (chatParam) {
      const numericId = Number(chatParam);
      if (Number.isInteger(numericId) && numericId > 0) {
        openChat(numericId);
      } else {

        fetch(`/api/chat/${chatParam}`)
          .then((r) => r.json())
          .then((json) => {
            if (!json.error && typeof json.chatId === "number") openChat(json.chatId);
          })
          .catch(() => {});
      }
      return;
    }

    const draftRaw = sessionStorage.getItem(NEW_CHAT_DRAFT_KEY);
    if (draftRaw) {
      try {
        setPendingNewChatMeta(JSON.parse(draftRaw) as PendingNewChat);
        setSelectedChatId(null);
        setView("room");
        setWidgetOpen(true);
      } catch {
        sessionStorage.removeItem(NEW_CHAT_DRAFT_KEY);
      }
    }
  }, [isLoggedIn]);

  
  
  const urlSyncReadyRef = useRef(false);
  useEffect(() => {
    if (!urlSyncReadyRef.current) {
      urlSyncReadyRef.current = true; 
      return;
    }
    const params = new URLSearchParams(window.location.search);


    const inRoom = isOpen && view === "room" && selectedChatId !== null;
    const inList = isOpen && view === "list";
    const selectedChatToken =
      selectedChatId !== null
        ? chats.find((c) => c.id === selectedChatId)?.id_token
        : undefined;
    const desired = inRoom
      ? (selectedChatToken ?? String(selectedChatId))
      : inList
        ? "list"
        : null;
    if (desired !== null) {
      if (params.get("chat") === desired) return;
      params.set("chat", desired);
    } else {
      if (!params.has("chat")) return;
      params.delete("chat");
    }
    const query = params.toString();
    window.history.replaceState(
      window.history.state,
      "",
      `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`,
    );
  }, [isOpen, view, selectedChatId, chats]);

  
  
  const draftSyncReadyRef = useRef(false);
  useEffect(() => {
    if (!draftSyncReadyRef.current) {
      draftSyncReadyRef.current = true; 
      return;
    }
    const isNewDraft =
      isOpen &&
      view === "room" &&
      selectedChatId === null &&
      pendingNewChatMeta !== null;
    if (isNewDraft) {
      sessionStorage.setItem(
        NEW_CHAT_DRAFT_KEY,
        JSON.stringify(pendingNewChatMeta),
      );
    } else {
      sessionStorage.removeItem(NEW_CHAT_DRAFT_KEY);
    }
  }, [isOpen, view, selectedChatId, pendingNewChatMeta]);

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
            <GroupChatRoomBody
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
