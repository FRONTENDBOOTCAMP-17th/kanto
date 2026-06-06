"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, MoreVertical, Plus, Send } from "lucide-react";
import type { MessageWithSender } from "@/type/chat/message";
import type { SellerInfo } from "@/type/user";
import { sendMessageAction } from "../actions";
import { supabase } from "@/lib/supabase";
import { formatMessageTime } from "@/utils/formatTime";
import { useClickOutside } from "@/hooks/useClickOutside";
import { useSpamPrevention } from "@/hooks/chat/useSpamPrevention";
import { useChatRealtime } from "@/hooks/chat/useChatRealtime";
import { useChatMessages } from "@/hooks/chat/useChatMessages";

interface Props {
  initialMessages: MessageWithSender[];
  currentUser: SellerInfo;
  chatId: number;
  postId: number;
  partner: SellerInfo;
  postTitle: string;
}

export default function ChatRoomClient({
  initialMessages,
  currentUser,
  chatId,
  postId,
  partner,
  postTitle,
}: Props) {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  const { isCooldown, cooldownSeconds, recordSend } = useSpamPrevention();

  const menuRef = useRef<HTMLDivElement>(null);

  // 메시지 목록과 관련된 모든 상태, ref, 함수 컴포넌트
  const {
    messages,
    setMessages,
    hasMore,
    isLoadingMore,
    loadMore,
    messagesEndRef,
    scrollContainerRef,
  } = useChatMessages({ initialMessages, currentUser, chatId, partner });

  // 바깥 클릭시 닫힘 (모달로 둘수도 있어서 일단 추가했음)
  useClickOutside(menuRef, () => setMenuOpen(false));

  // Realtime 로직
  useChatRealtime({ chatId, currentUser, partner, setMessages });

  useEffect(() => {
    (async () => {
      await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("chat_id", chatId)
        .neq("sender_id", currentUser.id)
        .eq("is_read", false);
    })();
  }, []);

  const handleSend = async () => {
    if (!input.trim()) return;

    if (recordSend()) {
      setInput("");
      return;
    }

    const content = input.trim();
    setInput("");

    const optimistic: MessageWithSender = {
      id: Date.now(),
      created_at: new Date().toISOString(),
      chat_id: chatId,
      sender_id: currentUser.id,
      post_id: postId,
      content,
      is_read: false,
      sender: currentUser,
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      await sendMessageAction({ chatId, postId, content });
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-teal-500 px-4 py-3 flex items-center gap-3 relative shrink-0">
        <button
          onClick={() => router.back()}
          className="text-white p-1 rounded-full hover:bg-teal-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="w-10 h-10 rounded-full bg-teal-400 flex items-center justify-center text-white font-semibold text-lg shrink-0">
          {partner.avatar_url ? (
            <Image
              src={partner.avatar_url}
              alt={partner.name}
              width={40}
              height={40}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            partner.name[0]
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm leading-tight">
            {partner.name}
          </p>
          <p className="text-teal-100 text-xs truncate">{postTitle}</p>
        </div>

        {/* 메뉴 버튼 */}
        <div ref={menuRef} className="relative">
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            className="text-white p-1 rounded-full hover:bg-teal-600 transition-colors"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-9 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden w-36 z-10">
              <button className="w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-gray-50 transition-colors">
                신고하기
              </button>
              <button className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-t border-gray-100">
                차단하기
              </button>
              <button className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-t border-gray-100">
                채팅방 나가기
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 메시지 영역 */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-4"
      >
        {/* 이전 메시지 불러오기 버튼 */}
        {hasMore && (
          <div className="flex justify-center">
            <button
              onClick={loadMore}
              disabled={isLoadingMore}
              className="cursor-pointer px-4 py-1.5 text-xs text-teal-600 bg-teal-50 rounded-full border border-teal-200 hover:bg-teal-100 transition-colors disabled:opacity-50"
            >
              {isLoadingMore ? "불러오는 중..." : "이전 메시지 보기"}
            </button>
          </div>
        )}

        {messages.map((msg) => {
          const isMine = msg.sender_id === currentUser.id;
          return (
            <div
              key={msg.id}
              className={`flex flex-col gap-1 ${isMine ? "items-end" : "items-start"}`}
            >
              <div
                className={`flex items-end gap-1 ${isMine ? "flex-row-reverse" : ""}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-keep ${
                    isMine
                      ? "bg-teal-500 text-white rounded-tr-sm"
                      : "bg-white text-gray-800 rounded-tl-sm shadow-sm"
                  }`}
                >
                  {msg.content}
                </div>
                <div
                  className={`flex flex-col shrink-0 ${isMine ? "items-end" : "items-start"}`}
                >
                  {isMine && !msg.is_read && (
                    <span className="text-xs text-teal-500 font-medium">1</span>
                  )}
                  <span className="text-xs text-gray-400">
                    {formatMessageTime(msg.created_at)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* 입력창 */}
      <div className="bg-white border-t border-gray-100 px-3 py-3 flex items-center gap-2 shrink-0">
        <button className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-teal-500 transition-colors shrink-0">
          <Plus className="w-5 h-5" />
        </button>

        <input
          type="text"
          value={input}
          disabled={isCooldown}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            isCooldown
              ? `도배 감지로 ${cooldownSeconds}초간 채팅이 금지되었습니다.`
              : "메시지를 입력하세요..."
          }
          className="flex-1 text-sm bg-gray-50 rounded-full px-4 py-2 outline-none border border-gray-200 focus:border-teal-400 transition-colors"
        />

        <button
          onClick={handleSend}
          disabled={!input.trim() || isCooldown}
          className="w-9 h-9 rounded-full bg-teal-500 flex items-center justify-center shrink-0 disabled:opacity-40 hover:bg-teal-600 transition-colors"
        >
          <Send className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  );
}
