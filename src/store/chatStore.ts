import { create } from "zustand";
import type { ChatWithUsers } from "@/type/chat/chat";
import type { MessageWithSender } from "@/type/chat/message";
import type { SellerInfo } from "@/type/user";
import { useAuthStore } from "@/store/authStore";
import { useSuspendedModalStore } from "@/hooks/useSuspended";

export interface PendingNewChat {
  buyerId: number;
  sellerId: number;
  postId: number;
  postTitle: string;
  postType: string;
  postPrice: number | null;
  partner: SellerInfo;
}

export interface PendingGroupRoom {
  meetupPostId: number;
  title: string;
}

export type ChatWidgetView = "list" | "room" | "group-room";

interface ChatState {
  chatList: ChatWithUsers[];
  messages: MessageWithSender[];
  unreadCount: number;
  pendingChatId: number | null;
  pendingNewChat: PendingNewChat | null;
  pendingGroupRoom: PendingGroupRoom | null;
  groupRoomsVersion: number;
  isOpen: boolean;
  view: ChatWidgetView;
  selectedChatId: number | null;
  newChatDraft: PendingNewChat | null;
  activeGroupRoom: PendingGroupRoom | null;

  setChatList: (
    update: ChatWithUsers[] | ((prev: ChatWithUsers[]) => ChatWithUsers[]),
  ) => void;
  setMessages: (messages: MessageWithSender[]) => void;
  addMessage: (message: MessageWithSender) => void;
  setUnreadCount: (count: number) => void;
  decreaseUnreadCount: () => void;
  openWidget: (chatId: number) => void;
  clearPendingChat: () => void;
  openNewChat: (meta: PendingNewChat) => void;
  clearNewChat: () => void;
  openGroupRoom: (meta: PendingGroupRoom) => void;
  clearPendingGroupRoom: () => void;
  refreshGroupRoomsList: () => void;
  setWidgetOpen: (open: boolean) => void;
  closeWidget: () => void;
  setView: (view: ChatWidgetView) => void;
  setSelectedChatId: (chatId: number | null) => void;
  setNewChatDraft: (draft: PendingNewChat | null) => void;
  setActiveGroupRoom: (room: PendingGroupRoom | null) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  chatList: [],
  messages: [],
  unreadCount: 0,
  pendingChatId: null,
  pendingNewChat: null,
  pendingGroupRoom: null,
  groupRoomsVersion: 0,
  isOpen: false,
  view: "list",
  selectedChatId: null,
  newChatDraft: null,
  activeGroupRoom: null,

  setChatList: (update) =>
    set((state) => ({
      chatList: typeof update === "function" ? update(state.chatList) : update,
    })),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  setUnreadCount: (count) => set({ unreadCount: count }),
  decreaseUnreadCount: () =>
    set((state) => ({
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),
  openWidget: (chatId) => {
    const until = useAuthStore.getState().user?.suspended_until;
    if (until && new Date(until) > new Date()) {
      useSuspendedModalStore.getState().open();
      return;
    }
    set({ pendingChatId: chatId });
  },
  clearPendingChat: () => set({ pendingChatId: null }),
  openNewChat: (meta) => set({ pendingNewChat: meta }),
  clearNewChat: () => set({ pendingNewChat: null }),
  openGroupRoom: (meta) => {
    const until = useAuthStore.getState().user?.suspended_until;
    if (until && new Date(until) > new Date()) {
      useSuspendedModalStore.getState().open();
      return;
    }
    set({ pendingGroupRoom: meta });
  },
  clearPendingGroupRoom: () => set({ pendingGroupRoom: null }),
  refreshGroupRoomsList: () =>
    set((state) => ({ groupRoomsVersion: state.groupRoomsVersion + 1 })),
  setWidgetOpen: (open) => set({ isOpen: open }),
  closeWidget: () => set({ isOpen: false }),
  setView: (view) => set({ view }),
  setSelectedChatId: (chatId) => set({ selectedChatId: chatId }),
  setNewChatDraft: (draft) => set({ newChatDraft: draft }),
  setActiveGroupRoom: (room) => set({ activeGroupRoom: room }),
}));
