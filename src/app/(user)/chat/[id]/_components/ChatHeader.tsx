"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ArrowLeft, MoreVertical } from "lucide-react";
import type { SellerInfo } from "@/type/user";
import { useClickOutside } from "@/hooks/useClickOutside";

interface Props {
  partner: SellerInfo;
  postTitle: string;
  onBack: () => void;
}

export default function ChatHeader({ partner, postTitle, onBack }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useClickOutside(menuRef, () => setMenuOpen(false));

  return (
    <div className="bg-teal-500 px-4 py-3 flex items-center gap-3 relative shrink-0">
      <button
        onClick={onBack}
        className="text-white p-1 rounded-full hover:bg-teal-600 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      <div className="w-10 h-10 rounded-full bg-teal-400 flex items-center justify-center text-white font-semibold text-lg shrink-0">
        {partner.avatar_url ? (
          <Image
            src={partner.avatar_url}
            alt={partner.name}
            width={40}
            height={40}
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          partner.name[0]
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-white font-semibold text-sm leading-tight">
          {partner.name}
        </p>
        <p className="text-teal-100 text-xs truncate">{postTitle}</p>
      </div>

      <div ref={menuRef} className="relative">
        <button
          onClick={() => setMenuOpen((prev) => !prev)}
          className="text-white p-1 rounded-full hover:bg-teal-600 transition-colors"
        >
          <MoreVertical className="w-5 h-5" />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-9 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden w-36 z-10">
            <button className="w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-gray-50 transition-colors">
              신고하기
            </button>
            <button className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-t border-gray-100">
              차단하기
            </button>
            <button className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-t border-gray-100">
              채팅방 나가기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
