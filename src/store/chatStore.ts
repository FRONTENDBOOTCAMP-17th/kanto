import { create } from "zustand";
import type { ChatWithUsers } from "@/type/chat/chat";
import type { MessageWithSender } from "@/type/chat/message";

interface ChatState {
  chatList: ChatWithUsers[];
  messages: MessageWithSender[];
  unreadCount: number;
  pendingChatId: number | null;

  setChatList: (chats: ChatWithUsers[]) => void;
  setMessages: (messages: MessageWithSender[]) => void;
  addMessage: (message: MessageWithSender) => void;
  setUnreadCount: (count: number) => void;
  decreaseUnreadCount: () => void;
  openWidget: (chatId: number) => void;
  clearPendingChat: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  chatList: [],
  messages: [],
  unreadCount: 0,
  pendingChatId: null,

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
}));
