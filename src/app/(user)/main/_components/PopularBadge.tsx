import { useTranslations } from "next-intl";

export default function PopularBadge() {
  const t = useTranslations("Main");
  return (
    <span className="absolute whitespace-nowrap text-center top-1.5 left-1.5 bg-teal-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
      {t("popularBadge")}
    </span>
  );
}
