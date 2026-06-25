"use client";

import { useCallback, useState, useEffect, useLayoutEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { useAuthStore } from "@/store/authStore";
import { useChatStore, type PendingNewChat, type PendingGroupRoom } from "@/store/chatStore";
import { useSuspended, useSuspendedModalStore } from "@/hooks/useSuspended";
import { useChatListRealtime } from "@/hooks/chat/useChatListRealtime";
import { getMyRooms } from "@/services/go/groupChat";
import ChatBubbleButton from "./ChatBubbleButton";
import ChatList from "./chatPanel/ChatList";
import ChatRoom from "./chatPanel/room/ChatRoom";
import GroupChatRoomBody from "@/components/go/groupChat/GroupChatRoomBody";
import type { ChatWithUsers } from "@/type/chat/chat";
import type { MyGroupRoom } from "@/type/groupChat";
import type { User } from "@/type/user";

// 아직 생성 전(첫 메시지 전)인 새 채팅 초안을 새로고침 동안 보관하는 키
const NEW_CHAT_DRAFT_KEY = "chatWidget:newChatDraft";

// useLayoutEffect는 SSR에서 경고를 내므로 클라이언트에서만 사용한다.
const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export default function FloatingChatWidget({
  initialUser,
}: {
  initialUser: User | null;
}) {
  const t = useTranslations("Chat");
  // SSR/하이드레이션 동안 zustand는 getInitialState()(=로그아웃 상태)를 반환하므로,
  // 서버가 내려준 initialUser로 첫 렌더부터 게이트를 확정한다(버튼 늦게 뜨는 현상 방지).
  const storeUser = useAuthStore((s) => s.user);
  const authUser = storeUser ?? initialUser;
  const isLoggedIn = !!authUser;
  const { isSuspended, openModal } = useSuspended();
  const setUnreadCount = useChatStore((s) => s.setUnreadCount);
  const groupRoomsVersion = useChatStore((s) => s.groupRoomsVersion);
  const isOpen = useChatStore((s) => s.isOpen);
  const setWidgetOpen = useChatStore((s) => s.setWidgetOpen);
  const [view, setView] = useState<"list" | "room" | "group-room">("list");
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
  const [pendingNewChatMeta, setPendingNewChatMeta] =
    useState<PendingNewChat | null>(null);
  const [selectedGroupRoom, setSelectedGroupRoom] = useState<PendingGroupRoom | null>(null);
  const [chats, setChats] = useState<ChatWithUsers[]>([]);
  const [groupRooms, setGroupRooms] = useState<MyGroupRoom[]>([]);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const refreshGroupRooms = () => {
    getMyRooms()
      .then(setGroupRooms)
      .catch(() => {});
  };
  const handleClose = useCallback(() => {
    setView("list");
    setSelectedChatId(null);
    setPendingNewChatMeta(null);
    setWidgetOpen(false);
  }, [setWidgetOpen]);

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

  // 새로고침 시 열려 있던 1:1 채팅방/새 채팅 초안을 복원한다.
  // - 생성된 채팅방: URL의 ?chat=<id> (openWidget 경로)
  // - 첫 메시지 전 새 채팅 초안: sessionStorage (openNewChat 경로)
  const restoredRef = useRef(false);
  useIsoLayoutEffect(() => {
    if (restoredRef.current || !isLoggedIn) return;
    restoredRef.current = true;

    // 페인트 전에(layout effect) 로컬 state를 직접 세팅해 오버레이를 같은 프레임에 띄운다.
    // 스토어→subscribe를 우회하는 이유: subscribe 리스너는 passive effect라
    // layout effect 시점엔 아직 미등록 → openWidget을 호출해도 변경을 놓친다.
    const chatParam = new URLSearchParams(window.location.search).get("chat");

    // 채팅 목록만 열려 있던 상태 복원 (밑 페이지로 빠지지 않게)
    if (chatParam === "list") {
      setView("list");
      setSelectedChatId(null);
      setPendingNewChatMeta(null);
      setWidgetOpen(true);
      return;
    }

    const id = Number(chatParam);
    if (chatParam && Number.isInteger(id) && id > 0) {
      const until = useAuthStore.getState().user?.suspended_until;
      if (until && new Date(until) > new Date()) {
        useSuspendedModalStore.getState().open();
        return;
      }
      setSelectedChatId(id);
      setPendingNewChatMeta(null);
      setView("room");
      setWidgetOpen(true);
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

  // 열려 있는 1:1 채팅방을 URL(?chat=<id>)에 반영해 새로고침에도 유지되게 한다.
  // (언더라잉 페이지를 재요청하지 않도록 history API로 URL만 갱신)
  const urlSyncReadyRef = useRef(false);
  useEffect(() => {
    if (!urlSyncReadyRef.current) {
      urlSyncReadyRef.current = true; // 최초 마운트는 복원 로직에 맡기고 건너뛴다
      return;
    }
    const params = new URLSearchParams(window.location.search);
    // 방: ?chat=<id> / 목록: ?chat=list (목록도 새로고침에 유지되도록)
    // 새 채팅 초안(room+selectedChatId 없음)은 sessionStorage로 따로 복원하므로 제외.
    const inRoom = isOpen && view === "room" && selectedChatId !== null;
    const inList = isOpen && view === "list";
    const desired = inRoom ? String(selectedChatId) : inList ? "list" : null;
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
  }, [isOpen, view, selectedChatId]);

  // 아직 생성 전인 새 채팅 초안을 sessionStorage에 저장해 새로고침에도 유지한다.
  // (생성되면 selectedChatId가 채워지며 ?chat 으로 전환되고, 닫히면 초안을 비운다)
  const draftSyncReadyRef = useRef(false);
  useEffect(() => {
    if (!draftSyncReadyRef.current) {
      draftSyncReadyRef.current = true; // 최초 마운트는 복원 로직에 맡기고 건너뛴다
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
              onChatSelect={(id) => {
                setSelectedChatId(id);
                setPendingNewChatMeta(null);
                setView("room");
              }}
              onGroupSelect={(meetupPostId, title) => {
                setSelectedGroupRoom({ meetupPostId, title });
                setView("group-room");
              }}
              onClose={handleClose}
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
