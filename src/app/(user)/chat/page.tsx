"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

interface MockChat {
  id: number;
  partnerName: string;
  partnerAvatar: string;
  category: string;
  lastMessage: string;
  time: string;
  unreadCount: number;
}

const MOCK_CHATS: MockChat[] = [
  {
    id: 1,
    partnerName: "김철수",
    partnerAvatar: "🖥️",
    category: "중고거래",
    lastMessage: "네, 직거래 가능합니다!",
    time: "오후 3:24",
    unreadCount: 0,
  },
  {
    id: 2,
    partnerName: "박영희",
    partnerAvatar: "💻",
    category: "중고거래",
    lastMessage: "가격 네고 가능할까요?",
    time: "오후 2:15",
    unreadCount: 2,
  },
  {
    id: 3,
    partnerName: "이민호",
    partnerAvatar: "👟",
    category: "중고거래",
    lastMessage: "사진 더 보내주실 수 있나요?",
    time: "오후 1:40",
    unreadCount: 0,
  },
  {
    id: 4,
    partnerName: "최수진",
    partnerAvatar: "🪑",
    category: "방렌트",
    lastMessage: "언제 거래 가능하신가요?",
    time: "오전 11:20",
    unreadCount: 0,
  },
  {
    id: 5,
    partnerName: "정하늘",
    partnerAvatar: "😊",
    category: "구인구직",
    lastMessage: "감사합니다!",
    time: "어제",
    unreadCount: 0,
  },
];

const categoryStyle: Record<string, string> = {
  중고거래: "bg-teal-50 text-teal-600",
  방렌트: "bg-cyan-50 text-cyan-600",
  구인구직: "bg-green-50 text-green-600",
};

export default function ChatListPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const filtered = MOCK_CHATS.filter((chat) =>
    chat.partnerName.includes(search)
  );

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
              검색 결과가 없습니다
            </div>
          ) : (
            filtered.map((chat, index) => (
              <div
                key={chat.id}
                onClick={() => router.push(`/chat/${chat.id}`)}
                className={`flex items-center gap-3 px-4 py-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                  index !== filtered.length - 1 ? "border-b border-gray-100" : ""
                }`}
              >
                {/* 아바타 */}
                <div className="w-12 h-12 rounded-full bg-teal-500 flex items-center justify-center text-xl shrink-0">
                  {chat.partnerAvatar}
                </div>

                {/* 내용 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-gray-900 text-sm">
                      {chat.partnerName}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${categoryStyle[chat.category] ?? "bg-gray-100 text-gray-500"}`}>
                      {chat.category}
                    </span>
                  </div>
                  <p className={`text-sm truncate ${chat.unreadCount > 0 ? "font-medium text-teal-600" : "text-gray-400"}`}>
                    {chat.lastMessage}
                  </p>
                </div>

                {/* 시간 + 읽지 않은 수 */}
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className="text-xs text-gray-400">{chat.time}</span>
                  {chat.unreadCount > 0 && (
                    <span className="w-5 h-5 rounded-full bg-teal-500 text-white text-xs flex items-center justify-center font-medium">
                      {chat.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
