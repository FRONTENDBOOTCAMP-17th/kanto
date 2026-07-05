import Link from "next/link";
import { ChevronRight, Zap } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { TopicBadge } from "@/components/go/TopicBadge";
import { MEETUP_TOPICS } from "@/constants/meetupTopics";
import type { CSSProperties } from "react";
import type { Meetup } from "@/type/go";

export default async function GoStats({ meetups }: { meetups: Meetup[] }) {
  if (meetups.length === 0) return null;

  const t = await getTranslations("Main");
  const tg = await getTranslations("Go");
  const participantCount = meetups.reduce((sum, m) => sum + m.participant_count + 1, 0);
  const topics = MEETUP_TOPICS.filter(({ key }) => key !== "other");
  const half = Math.ceil(topics.length / 2);
  // 행마다 뱃지 텍스트 총량이 달라 폭이 다르므로, 반복 횟수를 충분히 늘려 컨테이너보다
  // 항상 넓게 채우고(빈 구간 방지), 재생 시간을 텍스트량에 비례시켜 두 행의 체감 속도를 맞춘다.
  const ROW_REPEAT = 4;
  const topicRows = [topics.slice(0, half), topics.slice(half)].map((row) => {
    const setChars = row.reduce((sum, { key }) => sum + tg(`topics.${key}`).length, 0) * ROW_REPEAT;
    const duration = Math.max(setChars * 0.5, 16).toFixed(1);
    const items = Array.from({ length: ROW_REPEAT * 2 }).flatMap(() => row);
    return { items, duration };
  });

  return (
    <Link
      href="/go"
      className="cursor-pointer group flex items-center gap-4 rounded-2xl bg-white border border-gray-200 px-5 py-5 mb-3 min-h-24 hover:shadow-md transition-shadow"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-500 text-white">
        <Zap className="w-5 h-5" />
      </span>
      <div className="shrink-0">
        <p className="text-xs md:text-base font-bold text-gray-900">
          <span className="md:hidden">{t("goStats.inProgressShort", { count: meetups.length })}</span>
          <span className="hidden md:inline">{tg("map.inProgress", { count: meetups.length })}</span>
        </p>
        <p className="text-[11px] md:text-sm text-gray-500">
          <span className="md:hidden">{t("goStats.participantsShort", { count: participantCount })}</span>
          <span className="hidden md:inline">{t("goStats.participants", { count: participantCount })}</span>
        </p>
      </div>
      <div className="w-px self-stretch bg-gray-200 shrink-0" />
      <div className="flex-1 min-w-0 overflow-hidden mask-[linear-gradient(to_right,transparent,black_16px,black_calc(100%-16px),transparent)]">
        <div className="flex flex-col gap-1.5 md:hidden">
          {topicRows.map(({ items, duration }, rowIndex) => (
            <div
              key={rowIndex}
              className="flex w-max flex-nowrap gap-1.5 animate-[marquee_var(--marquee-duration)_linear_infinite] group-hover:paused motion-reduce:animate-none"
              style={{ "--marquee-duration": `${duration}s` } as CSSProperties}
            >
              {items.map(({ key: topic }, i) => (
                <TopicBadge
                  key={`${topic}-${i}`}
                  topic={topic}
                  label={tg(`topics.${topic}`)}
                  bordered={false}
                  className="inline-flex items-center shrink-0 rounded-full px-2.5 py-1 text-xs font-bold"
                />
              ))}
            </div>
          ))}
        </div>
        <div className="hidden md:flex w-max flex-nowrap gap-2 animate-[marquee_16s_linear_infinite] group-hover:paused motion-reduce:animate-none">
          {[...topics, ...topics].map(({ key: topic }, i) => (
            <TopicBadge
              key={`${topic}-${i}`}
              topic={topic}
              label={tg(`topics.${topic}`)}
              bordered={false}
              className="inline-flex items-center shrink-0 rounded-full px-4 py-2 text-sm font-bold"
            />
          ))}
        </div>
      </div>
      <ChevronRight className="w-5 h-5 shrink-0 text-gray-400" />
    </Link>
  );
}
