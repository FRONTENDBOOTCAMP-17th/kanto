"use client";

import { useTranslations } from "next-intl";

interface MangoIndexProps {
  score?: number | null;
  grade?: string | null;
}

function resolveGradeColor(grade: string | null | undefined) {
  if (grade === "A") return "text-teal-600";
  if (grade === "B") return "text-blue-600";
  if (grade === "C") return "text-yellow-600";
  if (grade === "E") return "text-red-500";
  return "text-orange-500";
}

export function MangoIndex({ score, grade }: MangoIndexProps) {
  const t = useTranslations("PublicProfile");
  const hasScore = score != null;
  const displayScore = hasScore ? Math.round(score) : null;

  return (
    <div className="flex flex-col items-center gap-0.5">
      <span
        className={
          hasScore
            ? `text-xl font-bold ${resolveGradeColor(grade)}`
            : "text-xs font-medium text-gray-400"
        }
      >
        {hasScore ? displayScore : t("preparing")}
      </span>
      <span className="text-xs text-gray-500">🥭 {t("mangoIndex")}</span>
    </div>
  );
}
