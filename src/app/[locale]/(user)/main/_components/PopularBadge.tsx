import { useTranslations } from "next-intl";

export default function PopularBadge({ compact = false }: { compact?: boolean }) {
  const t = useTranslations("Main");
  return (
    <span
      className={`absolute whitespace-nowrap text-center ${
        compact ? "top-0.5 left-0.5 md:top-1.5 md:left-1.5" : "top-1.5 left-1.5"
      } bg-teal-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded`}
    >
      {t("popularBadge")}
    </span>
  );
}
