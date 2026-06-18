import { create } from "zustand";
import type { ChatWithUsers } from "@/type/chat/chat";
import type { MessageWithSender } from "@/type/chat/message";
import type { SellerInfo } from "@/type/user";

export interface PendingNewChat {
  buyerId: number;
  sellerId: number;
  postId: number;
  postTitle: string;
  postPrice: number | null;
  partner: SellerInfo;
}

interface ChatState {
  chatList: ChatWithUsers[];
  messages: MessageWithSender[];
  unreadCount: number;
  pendingChatId: number | null;
  pendingNewChat: PendingNewChat | null;

  setChatList: (chats: ChatWithUsers[]) => void;
  setMessages: (messages: MessageWithSender[]) => void;
  addMessage: (message: MessageWithSender) => void;
  setUnreadCount: (count: number) => void;
  decreaseUnreadCount: () => void;
  openWidget: (chatId: number) => void;
  clearPendingChat: () => void;
  openNewChat: (meta: PendingNewChat) => void;
  clearNewChat: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  chatList: [],
  messages: [],
  unreadCount: 0,
  pendingChatId: null,
  pendingNewChat: null,

  setChatList: (chats) => set({ chatList: chats }),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  setUnreadCount: (count) => set({ unreadCount: count }),
  decreaseUnreadCount: () =>
    set((state) => ({
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),
  openWidget: (chatId) => set({ pendingChatId: chatId }),
  clearPendingChat: () => set({ pendingChatId: null }),
  openNewChat: (meta) => set({ pendingNewChat: meta }),
  clearNewChat: () => set({ pendingNewChat: null }),
}));
