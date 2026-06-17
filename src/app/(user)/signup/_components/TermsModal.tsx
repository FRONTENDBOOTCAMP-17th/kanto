"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useTranslations } from "next-intl";

type ModalType = "terms" | "privacy" | "age";

interface TermsModalProps {
  modalType: ModalType;
  onClose: () => void;
  onAgree: () => void;
}

export function TermsModal({ modalType, onClose, onAgree }: TermsModalProps) {
  const t = useTranslations("Signup.modal");
  const [content, setContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/terms?type=${modalType}`)
      .then((res) => res.json())
      .then((data) => setContent(data.content))
      .catch(() => setContent(t("loadError")))
      .finally(() => setIsLoading(false));
  }, [modalType, t]);

  useEffect(() => {
    if (isLoading || !scrollRef.current) return;
    const el = scrollRef.current;
    setScrolledToBottom(el.scrollHeight <= el.clientHeight + 10);
  }, [isLoading]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    setScrolledToBottom(el.scrollHeight - el.scrollTop <= el.clientHeight + 10);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl flex flex-col max-h-[85vh]">
        <div className="px-6 pt-6 pb-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">{t(`titles.${modalType}`)}</h2>
        </div>

        <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-6 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-40 text-sm text-gray-400">
              {t("loading")}
            </div>
          ) : (
            <div className="prose prose-sm max-w-none text-gray-700">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content ?? ""}</ReactMarkdown>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-300 text-gray-700 font-medium py-2.5 rounded-md hover:bg-gray-50 transition-colors"
          >
            {t("cancel")}
          </button>
          <button
            onClick={onAgree}
            disabled={!scrolledToBottom || isLoading}
            className="flex-1 btn-primary disabled:bg-gray-300 disabled:cursor-not-allowed font-medium py-2.5 rounded-md transition-colors"
          >
            {scrolledToBottom ? t("agree") : t("readToEnd")}
          </button>
        </div>
      </div>
    </div>
  );
}
