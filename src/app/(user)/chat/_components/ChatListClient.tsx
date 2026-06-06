"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import type { ChatWithUsers } from "@/type/chat/chat";
import { useChatListRealtime } from "@/hooks/chat/useChatListRealtime";
import ChatListItem from "./ChatListItem";

interface Props {
  initialData: ChatWithUsers[];
  currentUserId: number;
}

export default function ChatListClient({ initialData, currentUserId }: Props) {
  const router = useRouter();
  const [chats, setChats] = useState<ChatWithUsers[]>(initialData);
  const [search, setSearch] = useState("");

  const filtered = chats.filter((chat) => {
    const other = chat.user_id_1 === currentUserId ? chat.user2 : chat.user1;
    return other?.name?.includes(search);
  });

  useChatListRealtime({ currentUserId, setChats });

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="max-w-2xl mx-auto">

        {/* 헤더 */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">채팅 목록</h1>
          <p className="text-sm text-gray-400 mt-1">진행 중인 대화를 확인하세요</p>
        </div>

        {/* 검색 */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="채팅 검색"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm outline-none focus:border-teal-400 transition-colors"
          />
        </div>

        {/* 채팅 목록 */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-gray-400 text-sm">
              채팅 내역이 없습니다
            </div>
          ) : (
            filtered.map((chat, index) => (
              <ChatListItem
                key={chat.id}
                chat={chat}
                currentUserId={currentUserId}
                isLast={index === filtered.length - 1}
                onClick={() => router.push(`/chat/${chat.id}`)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
