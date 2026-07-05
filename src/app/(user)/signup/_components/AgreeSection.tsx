"use client";

import { lockScroll, unlockScroll } from "@/utils/lockScroll";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Checkbox } from "@/components/ui/checkbox";
import { TermsModal } from "./TermsModal";

type ModalType = "terms" | "privacy" | "age";

type AgreedState = {
  terms: boolean;
  privacy: boolean;
  age: boolean;
  marketing: boolean;
  push: boolean;
};

export type SignupAgreements = AgreedState;

const AGREES = [
  { id: "terms", required: true },
  { id: "privacy", required: true },
  { id: "age", required: true },
  { id: "marketing", required: false },
  { id: "push", required: false },
];

interface AgreeSectionProps {
  onRequiredChange: (required: boolean) => void;
  onAgreedChange?: (agreed: SignupAgreements) => void;
}

export function AgreeSection({ onRequiredChange, onAgreedChange }: AgreeSectionProps) {
  const t = useTranslations("Signup.agree");
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
    modalType ? lockScroll() : unlockScroll();
    return () => {
      unlockScroll();
    };
  }, [modalType]);

  useEffect(() => {
    onRequiredChange(agreed.terms && agreed.privacy && agreed.age);
    onAgreedChange?.(agreed);
  }, [agreed, onAgreedChange, onRequiredChange]);

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
      <div className="space-y-3 border-t border-gray-100 pt-4">
        <label className="flex cursor-pointer items-center gap-3 rounded-md border border-gray-100 bg-gray-50 px-4 py-3.5 transition-colors hover:bg-gray-100/70">
          <Checkbox
            checked={allChecked}
            onCheckedChange={handleToggleAll}
            className="h-5 w-5 shrink-0 border-gray-300 bg-white data-checked:border-gray-300 data-checked:bg-white data-checked:text-gray-900"
          />
          <span className="text-sm font-bold text-gray-950">{t("all")}</span>
        </label>
        <div className="space-y-0.5">
          {AGREES.map((a) => (
            <label
              key={a.id}
              className="flex cursor-pointer items-start gap-3 rounded-md px-3 py-2.5 transition-colors hover:bg-gray-50"
            >
              <Checkbox
                checked={agreed[a.id as keyof AgreedState]}
                onCheckedChange={() => handleItemClick(a.id)}
                className="mt-0.5 h-4.5 w-4.5 shrink-0 border-gray-300 bg-white data-checked:border-gray-300 data-checked:bg-white data-checked:text-gray-900"
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[13px] font-semibold leading-5 text-gray-900">
                    {t(`items.${a.id}.label`)}
                  </span>
                  <span
                    className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase ${a.required ? "bg-slate-700 text-white" : "bg-gray-50 text-gray-400 ring-1 ring-inset ring-gray-200"}`}
                  >
                    {a.required ? t("required") : t("optional")}
                  </span>
                </div>
                <p className="mt-0.5 text-xs leading-4 text-gray-500">{t(`items.${a.id}.desc`)}</p>
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
