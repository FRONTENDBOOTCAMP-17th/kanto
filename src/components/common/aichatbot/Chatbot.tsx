"use client";

import { useState, useRef, useEffect } from "react";
import { BotMessageSquare, X, Send } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const INITIAL_MESSAGES: Message[] = [
  {
    role: "assistant",
    content: "안녕하세요! 칸토 AI 어시스턴트입니다\n무엇이든 편하게 물어보세요!",
  },
];

interface Props {
  isOpen: boolean;
  onToggle: () => void;
  mobileHidden?: boolean;
}

export default function Chatbot({ isOpen, onToggle, mobileHidden }: Props) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="relative">
      {isOpen && (
        <div
          className="
            absolute -bottom-14 right-full mr-3
            w-80 h-120 flex flex-col bg-white rounded-2xl shadow-2xl shadow-black/40 border border-gray-100 overflow-hidden
            max-md:fixed max-md:inset-0 max-md:mr-0 max-md:w-full max-md:h-full max-md:rounded-none max-md:shadow-none max-md:border-0 max-md:z-55
          "
        >
          {/* 헤더 */}
          <div className="flex items-center gap-3 px-4 py-3 bg-linear-to-r from-violet-600 to-indigo-600 text-white shrink-0">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <BotMessageSquare className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold leading-none">AI 어시스턴트</p>
            </div>
            <button
              onClick={onToggle}
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* 메시지 목록 */}
          <div
            className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-gray-50"
            data-chat-scroll
          >
            {messages.map((msg, i) => (
              <div key={i}>
                <div
                  className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-7 h-7 rounded-full bg-linear-to-br from-violet-500 to-indigo-500 flex items-center justify-center shrink-0 mt-0.5">
                      <BotMessageSquare className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div
                    className={`
                      max-w-[75%] px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap
                      ${
                        msg.role === "user"
                          ? "bg-violet-600 text-white rounded-tr-sm"
                          : "bg-white text-gray-800 rounded-tl-sm shadow-sm border border-gray-100"
                      }
                    `}
                  >
                    {msg.content}
                    {i === INITIAL_MESSAGES.length - 1 && messages.length === INITIAL_MESSAGES.length && (
                      <div className="flex flex-wrap gap-1.5 my-2">
                        {[
                          "인증뱃지는 어떻게 받나요?",
                          "안전거래 방법",
                          "망고지수는 어떤건가요?",
                        ].map((q) => (
                          <button
                            key={q}
                            onClick={() =>
                              setMessages((prev) => [...prev, { role: "user", content: q }])
                            }
                            className="text-xs px-2.5 py-1 rounded-full border border-violet-200 text-violet-600 hover:bg-violet-50 transition-colors whitespace-nowrap"
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* 입력창 */}
          <div className="bg-white border-t border-gray-100 px-4 py-3 flex items-center gap-2 shrink-0">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="메시지를 입력하세요..."
              className="flex-1 min-w-0 text-sm bg-gray-50 rounded-full px-4 py-2 outline-none border border-gray-200 focus:border-violet-400 focus:bg-white transition-colors"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center shrink-0 disabled:opacity-30 hover:bg-violet-700 transition-colors"
            >
              <Send className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
        </div>
      )}

      {/* 트리거 버튼 */}
      <button
        onClick={onToggle}
        className={`relative z-50 w-12 h-12 bg-linear-to-br from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 rounded-full shadow-lg flex items-center justify-center text-white transition-all hover:scale-105 active:scale-95 ${mobileHidden ? "max-md:hidden" : ""}`}
      >
        {isOpen ? <X className="w-6 h-6" /> : <BotMessageSquare className="w-6 h-6" />}
      </button>
    </div>
  );
}
