"use client";

import { ChevronLeft } from "lucide-react";
import { useRouter } from "@/i18n/navigation";

export default function BackButton() {
  const router = useRouter();
  return (
    <button
      onClick={() => {
        // 정적 렌더링을 위해 useSearchParams 대신 클릭 시점에 쿼리를 읽는다
        const fromPage = new URLSearchParams(window.location.search).get("fromPage");
        router.push(fromPage ? `/rental?page=${fromPage}` : "/rental");
      }}
      className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 transition-colors cursor-pointer active:scale-100"
    >
      <ChevronLeft className="w-4 h-4" />
    </button>
  );
}
