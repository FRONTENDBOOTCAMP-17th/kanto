import Link from "next/link";
import { ChevronRight, Zap } from "lucide-react";
import { getTranslations } from "next-intl/server";
import GoStats from "./GoStats";
import MeetupCarousel from "./MeetupCarousel";
import type { Meetup } from "@/type/go";

export default async function GoPreview({ meetups }: { meetups: Meetup[] }) {
  const t = await getTranslations("Main");
  const preview = meetups.slice(0, 6);

  return (
    <section className="page-container border-t border-gray-200 py-8">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-xl font-bold">{t("goPreview.title")}</h2>
      </div>

      <GoStats meetups={meetups} />

      {preview.length === 0 ? (
        <Link
          href="/go"
          className="cursor-pointer flex items-center justify-between gap-3 rounded-2xl bg-teal-50 px-5 py-4 hover:bg-teal-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-500 text-white">
              <Zap className="w-5 h-5" />
            </span>
            <div>
              <p className="font-semibold text-gray-900">{t("goPreview.emptyTitle")}</p>
              <p className="text-sm text-gray-500">{t("goPreview.emptyDescription")}</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
        </Link>
      ) : (
        <MeetupCarousel meetups={preview} />
      )}
    </section>
  );
}
