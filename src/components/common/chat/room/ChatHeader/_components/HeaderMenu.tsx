"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { MoreVertical } from "lucide-react";
import { useClickOutside } from "@/hooks/useClickOutside";

interface Props {
  isReserved?: boolean;
  onToggleReserve?: () => void;
  isCheckingReport: boolean;
  onReportClick: () => void;
  iBlocked: boolean;
  onBlock: () => void;
  onUnblock: () => void;
  onLeave: () => void;
}

export default function HeaderMenu({
  isReserved,
  onToggleReserve,
  isCheckingReport,
  onReportClick,
  iBlocked,
  onBlock,
  onUnblock,
  onLeave,
}: Props) {
  const t = useTranslations("Chat");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useClickOutside(menuRef, () => setMenuOpen(false));

  const runAndClose = (fn: () => void) => {
    fn();
    setMenuOpen(false);
  };

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setMenuOpen((prev) => !prev)}
        aria-label={t("moreMenu")}
        aria-expanded={menuOpen}
        aria-haspopup="menu"
        className="text-white p-1 rounded-full hover:bg-teal-600 transition-colors"
      >
        <MoreVertical className="w-5 h-5" />
      </button>

      {menuOpen && (
        <div className="absolute right-0 top-9 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden w-36 z-10">
          {onToggleReserve !== undefined && (
            <button
              onClick={() => runAndClose(onToggleReserve)}
              className="w-full text-left px-4 py-3 text-sm text-teal-600 hover:bg-gray-50 transition-colors"
            >
              {isReserved ? t("cancelReserve") : t("setReserve")}
            </button>
          )}
          <button
            onClick={() => runAndClose(onReportClick)}
            disabled={isCheckingReport}
            className={`w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-gray-50 transition-colors ${onToggleReserve !== undefined ? "border-t border-gray-100" : ""}`}
          >
            {t("report")}
          </button>
          {iBlocked ? (
            <button
              onClick={() => runAndClose(onUnblock)}
              className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-t border-gray-100"
            >
              {t("unblock")}
            </button>
          ) : (
            <button
              onClick={() => runAndClose(onBlock)}
              className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-t border-gray-100"
            >
              {t("block")}
            </button>
          )}
          <button
            onClick={() => runAndClose(onLeave)}
            className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-t border-gray-100"
          >
            {t("leave")}
          </button>
        </div>
      )}
    </div>
  );
}
