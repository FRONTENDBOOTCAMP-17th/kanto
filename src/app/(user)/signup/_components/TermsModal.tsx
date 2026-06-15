"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type ModalType = "terms" | "privacy" | "age";

const MODAL_TITLES: Record<ModalType, string> = {
  terms: "서비스 이용약관",
  privacy: "개인정보 처리방침",
  age: "만 18세 이상 확인",
};

interface TermsModalProps {
  modalType: ModalType;
  onClose: () => void;
  onAgree: () => void;
}

export function TermsModal({ modalType, onClose, onAgree }: TermsModalProps) {
  const [content, setContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/terms?type=${modalType}`)
      .then((res) => res.json())
      .then((data) => setContent(data.content))
      .catch(() => setContent("내용을 불러올 수 없습니다. 잠시 후 다시 시도해주세요."))
      .finally(() => setIsLoading(false));
  }, [modalType]);

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
          <h2 className="text-lg font-semibold text-gray-900">{MODAL_TITLES[modalType]}</h2>
        </div>

        <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-6 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-40 text-sm text-gray-400">
              불러오는 중...
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
            취소
          </button>
          <button
            onClick={onAgree}
            disabled={!scrolledToBottom || isLoading}
            className="flex-1 btn-primary disabled:bg-gray-300 disabled:cursor-not-allowed font-medium py-2.5 rounded-md transition-colors"
          >
            {scrolledToBottom ? "동의합니다" : "끝까지 읽어주세요"}
          </button>
        </div>
      </div>
    </div>
  );
}
