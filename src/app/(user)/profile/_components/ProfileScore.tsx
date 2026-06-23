"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { refreshKtsScore } from "../_lib/actions";
import type { User as UserType } from "@/type/user";

type Grade = "A" | "B" | "C" | "D" | "E";

function resolveGrade(ktsGrade: string | null | undefined): Grade {
  if (ktsGrade && ["A", "B", "C", "D", "E"].includes(ktsGrade)) return ktsGrade as Grade;
  return "D";
}

const DURATION = 1200; // ms

export default function ProfileScore({ user }: { user: UserType }) {
  const target = user.kts_score ?? 0;
  const grade = resolveGrade(user.kts_grade);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [displayed, setDisplayed] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const start = performance.now();

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / DURATION, 1);
      // easeOutQuart
      const eased = 1 - Math.pow(1 - progress, 4);
      setDisplayed(Math.round(eased * target));
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target]);

  const pct = (displayed / 100) * 100;
  const barColor =
    grade === "A" ? "bg-teal-500"
    : grade === "B" ? "bg-blue-500"
    : grade === "C" ? "bg-yellow-400"
    : grade === "D" ? "bg-orange-400"
    : "bg-red-400";

  function handleRefresh() {
    startTransition(async () => {
      await refreshKtsScore();
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-gray-900">{displayed}</span>
          <span className="text-sm text-gray-400">/ 100점</span>
        </div>
        {process.env.NODE_ENV === "development" && (
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isPending}
            className="cursor-pointer text-xs text-teal-500 border border-teal-300 rounded-lg px-3 py-1.5 hover:bg-teal-50 transition-colors disabled:opacity-50"
          >
            {isPending ? "갱신 중..." : "지금 갱신"}
          </button>
        )}
      </div>

      <div className="w-full bg-gray-100 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${barColor}`}
          style={{ width: `${pct}%`, transition: "width 0.05s linear" }}
        />
      </div>

      <p className="text-xs text-gray-400 leading-relaxed">
        망고 지수는 거래 후기·완료 거래·활동 이력을 종합해 하루 1~2회 자동 갱신됩니다.
      </p>
    </div>
  );
}
