"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, MoreVertical, Plus, Send } from "lucide-react";
import type { MessageWithSender } from "@/type/chat/message";
import type { SellerInfo } from "@/type/user";
import { sendMessageAction, loadMoreMessagesAction } from "../actions";
import { supabase } from "@/lib/supabase";
import type { Message } from "@/type/chat/message";

interface Props {
  initialMessages: MessageWithSender[];
  currentUser: SellerInfo;
  chatId: number;
  postId: number;
  partner: SellerInfo;
  postTitle: string;
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("ko-KR", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
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
  const [messages, setMessages] =
    useState<MessageWithSender[]>(initialMessages);
  const [input, setInput] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  // 도배방지 상태
  const [isCooldown, setIsCooldown] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(10);

  // 이전 메시지 로드
  const [hasMore, setHasMore] = useState(initialMessages.length === 50);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const sendTimestamps = useRef<number[]>([]);
  const wasLoadingMore = useRef(false);

  useEffect(() => {
    if (wasLoadingMore.current) {
      wasLoadingMore.current = false;
      return;
    }
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const channel = supabase
      .channel(`chat-room-${chatId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          const sender =
            newMsg.sender_id === currentUser.id ? currentUser : partner;
          const msgWithSender: MessageWithSender = { ...newMsg, sender };

          if (newMsg.sender_id !== currentUser.id) {
            supabase
              .from("messages")
              .update({ is_read: true })
              .eq("id", newMsg.id)
              .then();
          }

          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;

            if (newMsg.sender_id === currentUser.id) {
              const idx = prev.findIndex(
                (m) =>
                  m.id > 1e12 &&
                  m.sender_id === currentUser.id &&
                  m.content === newMsg.content,
              );
              if (idx !== -1) {
                const updated = [...prev];
                updated[idx] = msgWithSender;
                return updated;
              }
            }

            return [...prev, msgWithSender];
          });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === payload.new.id
                ? { ...m, is_read: payload.new.is_read }
                : m,
            ),
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId, currentUser, partner]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  const loadMore = async () => {
    if (!hasMore || isLoadingMore || messages.length === 0) return;
    setIsLoadingMore(true);

    const oldest = messages[0].created_at;
    const data = await loadMoreMessagesAction(chatId, oldest);

    if (data.length === 0) {
      setHasMore(false);
      setIsLoadingMore(false);
      return;
    }

    // sender 정보를 currentUser/partner로 매핑
    const older: MessageWithSender[] = data.map((msg) => ({
      ...msg,
      sender: msg.sender_id === currentUser.id ? currentUser : partner,
    }));

    const container = scrollContainerRef.current;
    const prevScrollHeight = container?.scrollHeight ?? 0;

    wasLoadingMore.current = true;
    setMessages((prev) => [...older, ...prev]);
    setHasMore(data.length === 50);
    setIsLoadingMore(false);

    requestAnimationFrame(() => {
      if (container) {
        container.scrollTop = container.scrollHeight - prevScrollHeight;
      }
    });
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const now = Date.now();
    sendTimestamps.current.push(now);
    sendTimestamps.current = sendTimestamps.current.filter(
      (t) => now - t < 1500,
    );

    if (sendTimestamps.current.length >= 5) {
      setIsCooldown(true);
      setInput("");
      setCooldownSeconds(10);

      const interval = setInterval(() => {
        setCooldownSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setIsCooldown(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

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
                    {formatTime(msg.created_at)}
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
