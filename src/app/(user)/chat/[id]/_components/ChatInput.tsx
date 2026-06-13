"use client";

import { Plus, Send } from "lucide-react";

interface Props {
  input: string;
  onChange: (value: string) => void;
  onSend: () => void;
  isCooldown: boolean;
  cooldownSeconds: number;
}

export default function ChatInput({
  input,
  onChange,
  onSend,
  isCooldown,
  cooldownSeconds,
}: Props) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.nativeEvent.isComposing) return;
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="bg-white border-t border-gray-100 px-3 py-3 flex items-center gap-2 shrink-0">
      <button
        aria-label="파일 첨부"
        className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-teal-500 transition-colors shrink-0"
      >
        <Plus className="w-5 h-5" />
      </button>

      <input
        type="text"
        aria-label="메시지 입력"
        value={input}
        disabled={isCooldown}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={
          isCooldown
            ? `도배 감지로 ${cooldownSeconds}초간 채팅이 금지되었습니다.`
            : "메시지를 입력하세요..."
        }
        className="flex-1 text-sm bg-gray-50 rounded-full px-4 py-2 outline-none border border-gray-200 focus:border-teal-400 transition-colors"
      />

      <button
        onClick={onSend}
        disabled={!input.trim() || isCooldown}
        aria-label="메시지 전송"
        className="w-9 h-9 rounded-full bg-teal-500 flex items-center justify-center shrink-0 disabled:opacity-40 hover:bg-teal-600 transition-colors"
      >
        <Send className="w-4 h-4 text-white" />
      </button>
    </div>
  );
}
