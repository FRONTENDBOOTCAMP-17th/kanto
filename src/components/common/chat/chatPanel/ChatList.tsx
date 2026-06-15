"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import type { ChatWithUsers } from "@/type/chat/chat";
import ChatListItem from "./ChatListItem";

interface Props {
  chats: ChatWithUsers[];
  currentUserId: number;
  onChatSelect: (id: number) => void;
}

export default function ChatListClient({ chats, currentUserId, onChatSelect }: Props) {
  const [search, setSearch] = useState("");

  const filtered = chats.filter((chat) => {
    const other = chat.user_id_1 === currentUserId ? chat.user2 : chat.user1;
    return other?.name?.includes(search);
  });

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-gray-100 shrink-0">
        <h2 className="text-base md:text-sm font-semibold text-gray-900">채팅</h2>
      </div>

      <div className="px-3 py-2 border-b border-gray-100 shrink-0">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 md:w-3.5 md:h-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="검색"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 md:pl-8 pr-3 py-2 md:py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-sm md:text-xs outline-none focus:border-teal-400 focus:bg-white transition-colors"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-xs">
            채팅 내역이 없습니다
          </div>
        ) : (
          filtered.map((chat, index) => (
            <ChatListItem
              key={chat.id}
              chat={chat}
              currentUserId={currentUserId}
              isLast={index === filtered.length - 1}
              onClick={() => onChatSelect(chat.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
