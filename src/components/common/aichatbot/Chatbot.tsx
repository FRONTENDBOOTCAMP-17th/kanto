"use client";

import { useState, useRef, useEffect } from "react";
import { BotMessageSquare, X, Send, History, ChevronLeft, Plus } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useTranslations, useLocale } from "next-intl";
import { BCP47_LOCALE } from "@/i18n/config";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatSession {
  id: string;
  startedAt: string;
  preview: string;
  messages: Message[];
}

const HISTORY_KEY = "kanto_ai_history";

function loadHistory(): ChatSession[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem(HISTORY_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveToHistory(messages: Message[]) {
  const userMessages = messages.filter((m) => m.role === "user");
  if (userMessages.length === 0) return;

  const session: ChatSession = {
    id: Date.now().toString(),
    startedAt: new Date().toISOString(),
    preview: userMessages[0].content.slice(0, 50),
    messages,
  };

  const history = loadHistory();
  const updated = [session, ...history].slice(0, 20);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
}

interface Props {
  isOpen: boolean;
  onToggle: () => void;
  mobileHidden?: boolean;
}

export default function Chatbot({ isOpen, onToggle, mobileHidden }: Props) {
  const t = useTranslations("Chatbot");
  const locale = useLocale();

  const initialMessages: Message[] = [
    { role: "assistant", content: t("greeting") },
  ];

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [view, setView] = useState<"chat" | "history">("chat");
  const [history, setHistory] = useState<ChatSession[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<Message[]>(messages);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  
  useEffect(() => {
    const handleUnload = () => saveToHistory(messagesRef.current);
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, []);

  
  const handleClose = () => {
    saveToHistory(messagesRef.current);
    setMessages(initialMessages);
    setView("chat");
    setInput("");
    onToggle();
  };

  
  const handleCloseRef = useRef(handleClose);
  handleCloseRef.current = handleClose;

  
  useEffect(() => {
    if (!isOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        handleCloseRef.current();
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleHistoryOpen = () => {
    setHistory(loadHistory());
    setView("history");
  };

  const sendMessage = async (text: string) => {
    if (!text || isLoading) return;

    const userMessage: Message = { role: "user", content: text };
    const updatedMessages = [...messages, userMessage];

    setMessages([...updatedMessages, { role: "assistant", content: "" }]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages }),
      });

      if (!res.ok) throw new Error("rate_limit");

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const lines = decoder.decode(value).split("\n\n").filter(Boolean);
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") break;

          const { delta } = JSON.parse(data);
          if (!delta) continue;
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              role: "assistant",
              content: updated[updated.length - 1].content + delta,
            };
            return updated;
          });
        }
      }
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: t("errorMessage"),
        };
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = () => {
    const text = input.trim();
    sendMessage(text);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="relative" ref={rootRef}>
      {isOpen && (
        <div
          className="
            fixed bottom-6 right-21 z-50
            w-80 h-120 flex flex-col bg-white rounded-2xl shadow-2xl shadow-black/40 border border-gray-100 overflow-hidden
            max-md:inset-0 max-md:w-full max-md:h-full max-md:rounded-none max-md:shadow-none max-md:border-0 max-md:z-55
          "
        >
          
          <div className="flex items-center gap-3 px-4 py-3 bg-linear-to-r from-violet-600 to-indigo-600 text-white shrink-0">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <BotMessageSquare className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold leading-none">{t("title")}</p>
            </div>
            <button
              onClick={() => {
                setMessages(initialMessages);
                setView("chat");
              }}
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
              title={t("newChat")}
            >
              <Plus className="w-4 h-4" />
            </button>
            <button
              onClick={handleHistoryOpen}
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
              title={t("history")}
            >
              <History className="w-4 h-4" />
            </button>
            <button
              onClick={handleClose}
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {view === "history" ? (
            
            <div className="flex flex-col flex-1 overflow-hidden bg-gray-50">
              <div className="flex items-center gap-2 px-3 py-2.5 bg-white border-b border-gray-100 shrink-0">
                <button
                  onClick={() => setView("chat")}
                  className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-500"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm font-medium text-gray-700">{t("history")}</span>
              </div>
              {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center flex-1 gap-2 text-gray-400">
                  <History className="w-8 h-8 opacity-30" />
                  <p className="text-sm">{t("historyEmpty")}</p>
                </div>
              ) : (
                <ul className="flex-1 overflow-y-auto divide-y divide-gray-100">
                  {history.map((session) => (
                    <li
                      key={session.id}
                      onClick={() => {
                        setMessages(session.messages);
                        setView("chat");
                      }}
                      className="px-4 py-3 bg-white hover:bg-violet-50 cursor-pointer transition-colors"
                    >
                      <p className="text-xs text-gray-400">
                        {new Date(session.startedAt).toLocaleString(BCP47_LOCALE[locale as keyof typeof BCP47_LOCALE])}
                      </p>
                      <p className="text-sm text-gray-700 truncate mt-0.5">
                        {session.preview}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            
            <>
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
                        {msg.role === "assistant" ? (
                          <ReactMarkdown
                            components={{
                              p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
                              ul: ({ children }) => <ul className="list-disc pl-4 mb-1 space-y-0.5">{children}</ul>,
                              ol: ({ children }) => <ol className="list-decimal pl-4 mb-1 space-y-0.5">{children}</ol>,
                              strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                            }}
                          >
                            {msg.content}
                          </ReactMarkdown>
                        ) : (
                          msg.content
                        )}
                        {i === initialMessages.length - 1 &&
                          messages.length === initialMessages.length && (
                            <div className="flex flex-wrap gap-1.5 my-2">
                              {[
                                t("suggestions.badge"),
                                t("suggestions.safeTrade"),
                                t("suggestions.mangoIndex"),
                              ].map((q) => (
                                <button
                                  key={q}
                                  onClick={() => sendMessage(q)}
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
                {isLoading && (
                  <div className="flex gap-1 px-3 py-2">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.1s]" />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              
              <div className="bg-white border-t border-gray-100 px-4 py-3 flex items-center gap-2 shrink-0">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t("placeholder")}
                  className="flex-1 min-w-0 text-sm bg-gray-50 rounded-full px-4 py-2 outline-none border border-gray-200 focus:border-violet-400 focus:bg-white transition-colors"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center shrink-0 disabled:opacity-30 hover:bg-violet-700 transition-colors"
                >
                  <Send className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
            </>
          )}
        </div>
      )}

      
      <button
        onClick={isOpen ? handleClose : onToggle}
        className={`relative z-50 w-12 h-12 bg-linear-to-br from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 rounded-full shadow-lg flex items-center justify-center text-white transition-all hover:scale-105 active:scale-95 ${mobileHidden ? "max-md:hidden" : ""}`}
      >
        {isOpen ? <X className="w-6 h-6" /> : <BotMessageSquare className="w-6 h-6" />}
      </button>
    </div>
  );
}
