"use client";

import { Send } from "lucide-react";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("Chat");
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.nativeEvent.isComposing) return;
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="bg-white border-t border-gray-100 px-4 py-3 md:px-3 md:py-2.5 flex items-center gap-2 shrink-0">
      <input
        type="text"
        aria-label={t("messageInputLabel")}
        value={input}
        disabled={isCooldown}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={
          isCooldown
            ? t("cooldown", { seconds: cooldownSeconds })
            : t("inputPlaceholder")
        }
        className="flex-1 min-w-0 text-base md:text-sm bg-gray-50 rounded-full px-4 py-2.5 md:py-2 outline-none border border-gray-200 focus:border-teal-400 focus:bg-white transition-colors disabled:opacity-50"
      />
      <button
        onClick={onSend}
        disabled={!input.trim() || isCooldown}
        aria-label={t("messageSend")}
        className="w-10 h-10 md:w-8 md:h-8 rounded-full bg-teal-500 flex items-center justify-center shrink-0 disabled:opacity-30 hover:bg-teal-600 transition-colors"
      >
        <Send className="w-4 h-4 md:w-3.5 md:h-3.5 text-white" />
      </button>
    </div>
  );
}
