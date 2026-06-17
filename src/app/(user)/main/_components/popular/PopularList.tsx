import { ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import MainCard, { type MainCardItem } from "../MainCard";
import Link from "next/link";

interface PopularListProps {
  title: string;
  items: MainCardItem[];
  link: string;
}

export default function PopularList({ title, items, link }: PopularListProps) {
  const t = useTranslations("Common");
  return (
    <section className="mb-10">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">{title}</h2>
        <Link href={link}  className="flex gap-1 cursor-pointer items-center text-teal-500 font-medium text-sm">
          {t("viewAll")}
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="mt-3 flex flex-col gap-2 md:grid md:grid-cols-4 md:gap-4">
        {items.map((item) => (
          <MainCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
