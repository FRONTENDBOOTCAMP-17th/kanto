"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { refreshKtsScore } from "@/app/(user)/profile/_lib/actions";

export default function PopularRefreshButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleRefresh() {
    startTransition(async () => {
      await refreshKtsScore();
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleRefresh}
      disabled={isPending}
      className="cursor-pointer text-xs text-teal-500 border border-teal-300 rounded-lg px-3 py-1.5 hover:bg-teal-50 transition-colors disabled:opacity-50"
    >
      {isPending ? "갱신 중..." : "인기 게시물 갱신"}
    </button>
  );
}
