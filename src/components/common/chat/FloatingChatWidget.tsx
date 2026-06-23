"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { useAuthStore } from "@/store/authStore";
import { useChatStore, type PendingNewChat } from "@/store/chatStore";
import { useSuspended } from "@/hooks/useSuspended";
import { useChatListRealtime } from "@/hooks/chat/useChatListRealtime";
import ChatBubbleButton from "./ChatBubbleButton";
import ChatList from "./chatPanel/ChatList";
import ChatRoom from "./chatPanel/room/ChatRoom";
import type { ChatWithUsers } from "@/type/chat/chat";

// 아직 생성 전(첫 메시지 전)인 새 채팅 초안을 새로고침 동안 보관하는 키
const NEW_CHAT_DRAFT_KEY = "chatWidget:newChatDraft";

export default function FloatingChatWidget() {
  const t = useTranslations("Chat");
  const { isLoggedIn, user: authUser } = useAuthStore();
  const { isSuspended, openModal } = useSuspended();
  const setUnreadCount = useChatStore((s) => s.setUnreadCount);
  const isOpen = useChatStore((s) => s.isOpen);
  const setWidgetOpen = useChatStore((s) => s.setWidgetOpen);
  const [view, setView] = useState<"list" | "room">("list");
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
  const [pendingNewChatMeta, setPendingNewChatMeta] =
    useState<PendingNewChat | null>(null);
  const [chats, setChats] = useState<ChatWithUsers[]>([]);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

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

  // 새로고침 시 열려 있던 1:1 채팅방/새 채팅 초안을 복원한다.
  // - 생성된 채팅방: URL의 ?chat=<id> (openWidget 경로)
  // - 첫 메시지 전 새 채팅 초안: sessionStorage (openNewChat 경로)
  const restoredRef = useRef(false);
  useEffect(() => {
    if (restoredRef.current || !isLoggedIn) return;
    restoredRef.current = true;

    const chatParam = new URLSearchParams(window.location.search).get("chat");
    const id = Number(chatParam);
    if (chatParam && Number.isInteger(id) && id > 0) {
      useChatStore.getState().openWidget(id);
      return;
    }

    const draftRaw = sessionStorage.getItem(NEW_CHAT_DRAFT_KEY);
    if (draftRaw) {
      try {
        useChatStore
          .getState()
          .openNewChat(JSON.parse(draftRaw) as PendingNewChat);
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
    const inRoom = isOpen && view === "room" && selectedChatId !== null;
    if (inRoom) {
      if (params.get("chat") === String(selectedChatId)) return;
      params.set("chat", String(selectedChatId));
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

  const handleClose = () => {
    setView("list");
    setSelectedChatId(null);
    setPendingNewChatMeta(null);
    setWidgetOpen(false);
  };

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
              currentUserId={currentUserId}
              onChatSelect={(id) => {
                setSelectedChatId(id);
                setPendingNewChatMeta(null);
                setView("room");
              }}
              onClose={handleClose}
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
            }
            setWidgetOpen(!isOpen);
          }}
        />
      </div>
    </div>
  );
}
