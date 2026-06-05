"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, MoreVertical, Plus, Send } from "lucide-react";

interface MockMessage {
  id: number;
  senderId: number;
  content: string;
  time: string;
}

const MY_ID = 1;

const MOCK_MESSAGES: MockMessage[] = [
  { id: 1, senderId: 2, content: "안녕하세요! 상품 문의드립니다.", time: "오후 2:30" },
  { id: 2, senderId: 1, content: "네, 안녕하세요. 무엇이 궁금하신가요?", time: "오후 2:31" },
  { id: 3, senderId: 2, content: "직거래 가능한가요?", time: "오후 2:32" },
  { id: 4, senderId: 1, content: "네, 직거래 가능합니다!", time: "오후 2:33" },
];

const MOCK_PARTNER = {
  name: "김철수",
  avatar: "🖥️",
  postTitle: "아이폰 15 Pro 판매합니다",
};

export default function ChatRoomPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<MockMessage[]>(MOCK_MESSAGES);
  const [input, setInput] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // 새 메시지 올 때마다 스크롤 하단 이동
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSend = () => {
    if (!input.trim()) return;
    const newMessage: MockMessage = {
      id: messages.length + 1,
      senderId: MY_ID,
      content: input.trim(),
      time: new Date().toLocaleTimeString("ko-KR", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }),
    };
    setMessages((prev) => [...prev, newMessage]);
    setInput("");
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

        <div className="w-10 h-10 rounded-full bg-teal-400 flex items-center justify-center text-lg shrink-0">
          {MOCK_PARTNER.avatar}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm leading-tight">
            {MOCK_PARTNER.name}
          </p>
          <p className="text-teal-100 text-xs truncate">
            {MOCK_PARTNER.postTitle}
          </p>
        </div>

        {/* 메뉴 버튼 */}
        <div ref={menuRef} className="relative">
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            className="text-white p-1 rounded-full hover:bg-teal-600 transition-colors"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {/* 드롭다운 메뉴 */}
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
      <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-4">
        {messages.map((msg) => {
          const isMine = msg.senderId === MY_ID;
          return (
            <div
              key={msg.id}
              className={`flex flex-col gap-1 ${isMine ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  isMine
                    ? "bg-teal-500 text-white rounded-tr-sm"
                    : "bg-white text-gray-800 rounded-tl-sm shadow-sm"
                }`}
              >
                {msg.content}
              </div>
              <span className="text-xs text-gray-400">{msg.time}</span>
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
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="메시지를 입력하세요..."
          className="flex-1 text-sm bg-gray-50 rounded-full px-4 py-2 outline-none border border-gray-200 focus:border-teal-400 transition-colors"
        />

        <button
          onClick={handleSend}
          disabled={!input.trim()}
          className="w-9 h-9 rounded-full bg-teal-500 flex items-center justify-center shrink-0 disabled:opacity-40 hover:bg-teal-600 transition-colors"
        >
          <Send className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  );
}
