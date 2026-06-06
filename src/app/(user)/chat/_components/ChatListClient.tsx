"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import type { Chat, ChatWithUsers } from "@/type/chat/chat";
import { supabase } from "@/lib/supabase";

const categoryLabel: Record<string, string> = {
  used_goods: "중고거래",
  room_rent: "방렌트",
  job: "구인구직",
};

const categoryStyle: Record<string, string> = {
  중고거래: "bg-teal-50 text-teal-600",
  방렌트: "bg-cyan-50 text-cyan-600",
  구인구직: "bg-green-50 text-green-600",
};

function formatTime(dateStr: string | null): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  if (isToday) {
    return date.toLocaleTimeString("ko-KR", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }
  return "어제";
}

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

  useEffect(() => {
    const channel = supabase
      .channel(`chat-list-${currentUserId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "chats" },
        (payload) => {
          const updated = payload.new as Chat;
          if (updated.user_id_1 !== currentUserId && updated.user_id_2 !== currentUserId) return;

          setChats((prev) =>
            prev
              .map((c) =>
                c.id === updated.id
                  ? { ...c, last_message_at: updated.last_message_at, last_message_content: updated.last_message_content }
                  : c
              )
              .sort((a, b) =>
                (b.last_message_at ?? "").localeCompare(a.last_message_at ?? "")
              )
          );
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentUserId]);

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
            filtered.map((chat, index) => {
              const otherUser = chat.user_id_1 === currentUserId ? chat.user2 : chat.user1;
              const lastMessage = chat.last_message_content;
              const unreadCount = chat.messages?.filter((m) => !m.is_read).length ?? 0;
              const category = categoryLabel[chat.posts?.post_type ?? ""] ?? chat.posts?.post_type ?? "";

              return (
                <div
                  key={chat.id}
                  onClick={() => router.push(`/chat/${chat.id}`)}
                  className={`flex items-center gap-3 px-4 py-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                    index !== filtered.length - 1 ? "border-b border-gray-100" : ""
                  }`}
                >
                  {/* 아바타 */}
                  <div className="w-12 h-12 rounded-full bg-teal-500 flex items-center justify-center text-white font-semibold text-lg shrink-0">
                    {otherUser?.name?.[0] ?? "?"}
                  </div>

                  {/* 내용 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-semibold text-gray-900 text-sm">
                        {otherUser?.name ?? "알 수 없음"}
                      </span>
                      {category && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${categoryStyle[category] ?? "bg-gray-100 text-gray-500"}`}>
                          {category}
                        </span>
                      )}
                    </div>
                    <p className={`text-sm truncate ${unreadCount > 0 ? "font-medium text-teal-600" : "text-gray-400"}`}>
                      {lastMessage ?? "메시지가 없습니다"}
                    </p>
                  </div>

                  {/* 시간 + 읽지 않은 수 */}
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className="text-xs text-gray-400">
                      {formatTime(chat.last_message_at)}
                    </span>
                    {unreadCount > 0 && (
                      <span className="w-5 h-5 rounded-full bg-teal-500 text-white text-xs flex items-center justify-center font-medium">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
