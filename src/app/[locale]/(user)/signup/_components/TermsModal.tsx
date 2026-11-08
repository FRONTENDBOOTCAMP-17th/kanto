"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useTranslations } from "next-intl";
import type { ModalType, TermsResource } from "../_hooks/useSignupTerms";

interface TermsModalProps {
  modalType: ModalType;
  resource: TermsResource;
  onRetry: () => void;
  onClose: () => void;
  onAgree: () => void;
}

export function TermsModal({
  modalType,
  resource,
  onRetry,
  onClose,
  onAgree,
}: TermsModalProps) {
  const t = useTranslations("Signup.modal");
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isLoading = resource.status === "loading";
  const loadFailed = resource.status === "error";
  const canAgreeWithoutScroll = modalType === "age";
  const canAgree = !loadFailed && (canAgreeWithoutScroll || scrolledToBottom);

  useEffect(() => {
    if (isLoading || !scrollRef.current) return;
    const el = scrollRef.current;
    setScrolledToBottom(el.scrollHeight <= el.clientHeight + 10);
  }, [isLoading]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    setScrolledToBottom(el.scrollHeight - el.scrollTop <= el.clientHeight + 10);
  };

  const handlePrimaryClick = () => {
    if (loadFailed) return;

    if (canAgree) {
      onAgree();
      return;
    }

    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
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
          ) : loadFailed ? (
            <div className="flex h-40 flex-col items-center justify-center gap-3 text-center text-sm text-gray-500">
              <p>{t("loadError")}</p>
              <button
                type="button"
                onClick={onRetry}
                className="font-semibold text-teal-600 hover:text-teal-700"
              >
                {t("retry")}
              </button>
            </div>
          ) : (
            <div className="prose prose-sm max-w-none text-gray-700">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{resource.content ?? ""}</ReactMarkdown>
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
            onClick={handlePrimaryClick}
            disabled={isLoading || loadFailed}
            className="flex-1 btn-primary disabled:bg-gray-300 disabled:cursor-not-allowed font-medium py-2.5 rounded-md transition-colors"
          >
            {loadFailed ? t("unavailable") : canAgree ? t("agree") : t("scrollDown")}
          </button>
        </div>
      </div>
    </div>
  );
}
