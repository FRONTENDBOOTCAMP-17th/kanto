"use client";

import { useTranslations } from "next-intl";

interface MangoIndexProps {
  userId: number;
  /** 팀원이 KTS 점수 로직을 연결하면 이 값을 채운다. 없으면 "준비 중" 표시 */
  score?: number | null;
}

// 망고지수(KTS) 스텁. 점수 소스가 준비되면 (a) 상위에서 score를 내려주거나
// (b) 여기서 userId로 직접 조회하도록 바꾼다. 어느 쪽이든 부모 JSX는 그대로다.
export function MangoIndex({ userId, score }: MangoIndexProps) {
  const t = useTranslations("PublicProfile");

  const hasScore = score != null;

  return (
    // data-user-id: 팀원이 userId로 점수를 조회할 때 사용하는 seam
    <div data-user-id={userId} className="flex flex-col items-center gap-0.5">
      <span
        className={
          hasScore
            ? "text-xl font-bold text-gray-900"
            : "text-xs font-medium text-gray-400"
        }
      >
        {hasScore ? `${score}°` : t("preparing")}
      </span>
      <span className="text-xs text-gray-500">🥭 {t("mangoIndex")}</span>
    </div>
  );
}
