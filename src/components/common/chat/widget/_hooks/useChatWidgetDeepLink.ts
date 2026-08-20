import { useEffect, useLayoutEffect, useRef } from "react";
import { useAuthStore } from "@/store/authStore";
import { useChatStore, type PendingNewChat } from "@/store/chatStore";
import { useSuspendedModalStore } from "@/hooks/useSuspended";

const NEW_CHAT_DRAFT_KEY = "chatWidget:newChatDraft";

const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/** 순서: 구독 → URL 복원 → URL 동기화 → draft 저장  */

/** 앱의 다른 곳에서 채팅 스토어를 통해 들어오는 "이 채팅 열어줘" 요청에 반응한다. */
export function useChatWidgetExternalOpenSync() {
  /*
    setView: 화면전환 - list/room/group-room
    setSelectedChatId: 기존 채팅방 id
    setNewChatDraft: 새 채팅 초안
    setSelectedGroupRoom: 열려있는 그룹채팅방(게시물 id, 제목)
    setChats: 내 1:1 채팅 목록
  */
  const setView = useChatStore((s) => s.setView);
  const setSelectedChatId = useChatStore((s) => s.setSelectedChatId);
  const setNewChatDraft = useChatStore((s) => s.setNewChatDraft);
  const setSelectedGroupRoom = useChatStore((s) => s.setActiveGroupRoom);
  const setChats = useChatStore((s) => s.setChatList);

  useEffect(() => {
    return useChatStore.subscribe((state, prev) => {
      if (state.pendingChatId && state.pendingChatId !== prev.pendingChatId) {
        useChatStore.getState().setWidgetOpen(true);
        setView("room");
        setSelectedChatId(state.pendingChatId);
        setNewChatDraft(null);
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
        setNewChatDraft(state.pendingNewChat);
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
  }, [setView, setSelectedChatId, setNewChatDraft, setSelectedGroupRoom, setChats]);
}

/** 마운트 시 한 번, `?chat=` URL 쿼리 파라미터나 저장된 draft로부터 위젯 화면을 복원한다. */
export function useChatWidgetUrlRestore(isLoggedIn: boolean) {
  /*
    setView: 화면전환 - list/room/group-room
    setSelectedChatId: 기존 채팅방 id
    setNewChatDraft: 새 채팅 초안
    setWidgetOpen: 위젯 패널 열림/닫힘
  */
  const setView = useChatStore((s) => s.setView);
  const setSelectedChatId = useChatStore((s) => s.setSelectedChatId);
  const setNewChatDraft = useChatStore((s) => s.setNewChatDraft);
  const setWidgetOpen = useChatStore((s) => s.setWidgetOpen);

  const restoredRef = useRef(false);
  useIsoLayoutEffect(() => {
    if (restoredRef.current || !isLoggedIn) return;
    restoredRef.current = true;

    const chatParam = new URLSearchParams(window.location.search).get("chat");

    if (chatParam === "list") {
      setView("list");
      setSelectedChatId(null);
      setNewChatDraft(null);
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
      setNewChatDraft(null);
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
        setNewChatDraft(JSON.parse(draftRaw) as PendingNewChat);
        setSelectedChatId(null);
        setView("room");
        setWidgetOpen(true);
      } catch {
        sessionStorage.removeItem(NEW_CHAT_DRAFT_KEY);
      }
    }
  }, [isLoggedIn]);
}

/** 위젯의 현재 화면 상태를 `?chat=` URL 쿼리 파라미터에 다시 반영한다. */
export function useChatWidgetUrlSync() {
  /*
    isOpen: 위젯 패널 열림/닫힘
    view: 화면전환 - list/room/group-room
    selectedChatId: 기존 채팅방 id
    chats: 내 1:1 채팅 목록 (id_token 조회용)
  */
  const isOpen = useChatStore((s) => s.isOpen);
  const view = useChatStore((s) => s.view);
  const selectedChatId = useChatStore((s) => s.selectedChatId);
  const chats = useChatStore((s) => s.chatList);

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
}

/** 아직 안 보낸 새 채팅 draft를 세션스토리지에 저장해 새로고침해도 유지되게 한다. */
export function useChatWidgetDraftPersist() {
  /*
    isOpen: 위젯 패널 열림/닫힘
    view: 화면전환 - list/room/group-room
    selectedChatId: 기존 채팅방 id (draft는 이게 null일 때만 유효)
    newChatDraft: 저장 대상 - 새 채팅 초안
  */
  const isOpen = useChatStore((s) => s.isOpen);
  const view = useChatStore((s) => s.view);
  const selectedChatId = useChatStore((s) => s.selectedChatId);
  const newChatDraft = useChatStore((s) => s.newChatDraft);

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
      newChatDraft !== null;
    if (isNewDraft) {
      sessionStorage.setItem(
        NEW_CHAT_DRAFT_KEY,
        JSON.stringify(newChatDraft),
      );
    } else {
      sessionStorage.removeItem(NEW_CHAT_DRAFT_KEY);
    }
  }, [isOpen, view, selectedChatId, newChatDraft]);
}
