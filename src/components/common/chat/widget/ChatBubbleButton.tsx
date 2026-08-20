"use client";

import { MessageCircle, X } from "lucide-react";
import { useChatStore } from "@/store/chatStore";

interface ChatBubbleButtonProps {
  isOpen: boolean;
  onToggle: () => void;
}

export default function ChatBubbleButton({ isOpen, onToggle }: ChatBubbleButtonProps) {
  const unreadCount = useChatStore((state) => state.unreadCount);

  return (
    <button
      onClick={onToggle}
      className="relative z-50 w-12 h-12 bg-teal-500 hover:bg-teal-600 rounded-full shadow-lg flex items-center justify-center text-white transition-all hover:scale-105 active:scale-95"
    >
      {isOpen ? (
        <X className="w-6 h-6" />
      ) : (
        <>
          <MessageCircle className="w-6 h-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </>
      )}
    </button>
  );
}
