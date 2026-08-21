"use client";

import { useTranslations } from "next-intl";
import { ArrowLeft, Users } from "lucide-react";

interface Props {
  meetupTitle: string;
  onBack: () => void;
  onOpenMembers: () => void;
}

export default function Header({ meetupTitle, onBack, onOpenMembers }: Props) {
  const t = useTranslations("Go.chat");

  return (
    <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 shrink-0">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <button
          onClick={onBack}
          aria-label={t("back")}
          className="text-gray-400 hover:text-gray-600 shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-gray-900 truncate">
            {meetupTitle}
          </h2>
          <span className="text-xs text-gray-400">{t("title")}</span>
        </div>
      </div>
      <button
        onClick={onOpenMembers}
        aria-label={t("membersAria")}
        className="flex h-8 w-8 items-center justify-center rounded-[9px] text-gray-500 hover:bg-gray-100 shrink-0"
      >
        <Users className="h-4 w-4" strokeWidth={2.2} />
      </button>
    </div>
  );
}
