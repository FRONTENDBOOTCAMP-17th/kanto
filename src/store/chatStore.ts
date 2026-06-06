import { create } from "zustand";
import type { ChatWithUsers } from "@/type/chat/chat";
import type { MessageWithSender } from "@/type/chat/message";

interface ChatState {
  chatList: ChatWithUsers[]; // 내가 참여 중인 채팅방 목록
  messages: MessageWithSender[]; // 현재 열려있는 채팅방의 메시지들
  unreadCount: number; // 읽지 않은 메시지 총 갯수(뱃지에 숫자로 표시)

  setChatList: (chats: ChatWithUsers[]) => void; // 채팅 목록 페이지에 들어왔을 때 DB에서 가져온 채팅방 목록을 저장
  setMessages: (messages: MessageWithSender[]) => void; // 특정 채팅방에 들어갔을 때 그 방의 기존 메시지 전체를 저장
  addMessage: (message: MessageWithSender) => void; // 새 메시지가 도착했을 때, 기존 메시지 목록 뒤에 새 메시지 하나를 추가한다.
  setUnreadCount: (count: number) => void; // 앱을 처음 열었을 때 DB에서 읽지 않은 메시지 수를 가져와서 숫자를 세팅한다.
  decreaseUnreadCount: () => void; // 채팅방에 들어가서 메시지를 읽었을 때 읽지 않은 수를 1만큼을 줄인다. 이때, 0보다 아래로는 내려가지 않는다.
}

export const useChatStore = create<ChatState>((set) => ({
  chatList: [],
  messages: [],
  unreadCount: 0,

  setChatList: (chats) => set({ chatList: chats }),

  setMessages: (messages) => set({ messages }),

  // Realtime으로 새 메시지 수신 시 호출
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  setUnreadCount: (count) => set({ unreadCount: count }),

  // 채팅방 입장 시 읽음 처리
  decreaseUnreadCount: () =>
    set((state) => ({
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),
}));
