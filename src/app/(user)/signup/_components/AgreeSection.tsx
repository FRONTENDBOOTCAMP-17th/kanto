"use client";

import { useEffect, useState } from "react";
import { TermsModal } from "./TermsModal";

type ModalType = "terms" | "privacy" | "age";

type AgreedState = {
  terms: boolean;
  privacy: boolean;
  age: boolean;
  marketing: boolean;
  push: boolean;
};

const AGREES = [
  {
    id: "terms",
    label: "서비스 이용약관",
    desc: "면책조항, 금지행위, 제재 기준에 동의합니다",
    required: true,
  },
  {
    id: "privacy",
    label: "개인정보 처리방침",
    desc: "가입 시 이메일, 이름 등 개인정보가 저장됩니다",
    required: true,
  },
  {
    id: "age",
    label: "만 18세 이상 확인",
    desc: "결제 및 거래 서비스 이용을 위해 필요합니다",
    required: true,
  },
  {
    id: "marketing",
    label: "마케팅 수신 동의",
    desc: "이벤트, 혜택 등 마케팅 정보를 받습니다",
    required: false,
  },
  {
    id: "push",
    label: "푸시 알림 수신",
    desc: "채팅, 새 게시글 등 알림을 받습니다",
    required: false,
  },
];

interface AgreeSectionProps {
  onRequiredChange: (required: boolean) => void;
}

export function AgreeSection({ onRequiredChange }: AgreeSectionProps) {
  const [agreed, setAgreed] = useState<AgreedState>({
    terms: false,
    privacy: false,
    age: false,
    marketing: false,
    push: false,
  });
  const [modalType, setModalType] = useState<ModalType | null>(null);
  const [modalQueue, setModalQueue] = useState<ModalType[]>([]);

  const allChecked = Object.values(agreed).every((v) => v);

  useEffect(() => {
    document.body.style.overflow = modalType ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [modalType]);

  useEffect(() => {
    onRequiredChange(agreed.terms && agreed.privacy && agreed.age);
  }, [agreed.terms, agreed.privacy, agreed.age, onRequiredChange]);

  const handleItemClick = (id: string) => {
    if (id === "marketing" || id === "push") {
      setAgreed((prev) => ({ ...prev, [id]: !prev[id as keyof AgreedState] }));
      return;
    }
    const key = id as ModalType;
    if (agreed[key]) {
      setAgreed((prev) => ({ ...prev, [key]: false }));
    } else {
      setModalType(key);
    }
  };

  const handleToggleAll = () => {
    if (allChecked) {
      setAgreed({ terms: false, privacy: false, age: false, marketing: false, push: false });
      return;
    }
    setAgreed((prev) => ({ ...prev, marketing: true, push: true }));
    const order: ModalType[] = ["terms", "privacy", "age"];
    const queue = order.filter((id) => !agreed[id]);
    if (queue.length > 0) {
      setModalType(queue[0]);
      setModalQueue(queue.slice(1));
    }
  };

  const handleModalAgree = () => {
    if (!modalType) return;
    setAgreed((prev) => ({ ...prev, [modalType]: true }));
    if (modalQueue.length > 0) {
      const [next, ...rest] = modalQueue;
      setModalType(next);
      setModalQueue(rest);
    } else {
      setModalType(null);
    }
  };

  const handleModalClose = () => {
    setModalType(null);
    setModalQueue([]);
  };

  return (
    <>
      <div className="border-t pt-4 space-y-3">
        <label className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-3 cursor-pointer">
          <input
            type="checkbox"
            checked={allChecked}
            onChange={handleToggleAll}
            className="w-4 h-4 accent-teal-500 shrink-0"
          />
          <span className="text-sm font-medium text-gray-900">전체 동의하기</span>
        </label>
        <div className="space-y-1">
          {AGREES.map((a) => (
            <label
              key={a.id}
              className="flex items-start gap-3 px-4 py-2 cursor-pointer hover:bg-gray-50 rounded-lg transition-colors"
            >
              <input
                type="checkbox"
                checked={agreed[a.id as keyof AgreedState]}
                onChange={() => handleItemClick(a.id)}
                className="mt-0.5 w-4 h-4 accent-teal-500 shrink-0"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-900">{a.label}</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${a.required ? "bg-teal-100 text-teal-600" : "bg-gray-100 text-gray-500"}`}
                  >
                    {a.required ? "필수" : "선택"}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{a.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {modalType && (
        <TermsModal
          key={modalType}
          modalType={modalType}
          onClose={handleModalClose}
          onAgree={handleModalAgree}
        />
      )}
    </>
  );
}
