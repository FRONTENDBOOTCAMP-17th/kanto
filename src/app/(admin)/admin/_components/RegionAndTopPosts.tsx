import Link from "next/link";
import { Eye } from "lucide-react";
import { CATEGORY } from "../_lib/constants";
import type { Category } from "@/type/admin";
import { getPostDetailUrl } from "@/services/admin/adminPosts";
import Card from "./Card";

interface Props {
  regions: { name: string; count: number }[];
  topPosts: { rank: number; id: number; post_type: string; title: string; cat: Category; views: string }[];
}

export default function RegionAndTopPosts({ regions, topPosts }: Props) {
  const regionTotal = regions.reduce((s, r) => s + r.count, 0) || 1;

  return (
    <div className="flex flex-wrap gap-5">
      <Card className="flex-[1_1_320px]">
        <h2 className="mb-5 text-[18px] font-extrabold tracking-tight text-slate-900">
          최근 7일 지역별 신규 게시글
        </h2>
        {regions.length === 0 ? (
          <div className="flex flex-col gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-8 animate-pulse rounded-lg bg-slate-100" />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {regions.map((r) => (
              <div key={r.name}>
                <div className="mb-[7px] flex items-center justify-between">
                  <span className="whitespace-nowrap text-[14px] font-semibold text-slate-700">
                    {r.name}
                  </span>
                  <span className="text-[13px] text-slate-400">
                    <span className="font-bold text-slate-900">
                      {r.count.toLocaleString()}
                    </span>
                    건 · {Math.round((r.count / regionTotal) * 100)}%
                  </span>
                </div>
                <div className="h-[9px] overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-teal-500 to-teal-600"
                    style={{
                      width: `${Math.round((r.count / (regions[0]?.count || 1)) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="flex-[1_1_320px] min-w-0">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-[18px] font-extrabold tracking-tight text-slate-900">
            인기 게시글 Top 5
          </h2>
          <span className="text-[13px] text-slate-400">조회수 기준</span>
        </div>
        {topPosts.length === 0 ? (
          <div className="flex flex-col gap-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-100" />
            ))}
          </div>
        ) : (
          <div className="flex flex-col">
            {topPosts.map((p) => {
              const url = getPostDetailUrl(p.post_type, p.id);
              const inner = (
                <>
                  <span className="w-[18px] flex-shrink-0 text-center text-[15px] font-extrabold text-slate-300">
                    {p.rank}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[14.5px] font-semibold text-slate-900">
                      {p.title}
                    </div>
                    <span
                      className="mt-1.5 inline-flex items-center rounded-md px-2 py-0.5 text-[11.5px] font-semibold"
                      style={{
                        background: CATEGORY[p.cat]?.bg ?? "#f8fafc",
                        color: CATEGORY[p.cat]?.fg ?? "#64748b",
                      }}
                    >
                      {p.cat}
                    </span>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-1.5 text-slate-400">
                    <Eye className="h-[15px] w-[15px]" strokeWidth={2} />
                    <span className="text-[13px] font-semibold text-slate-500">
                      {p.views}
                    </span>
                  </div>
                </>
              );
              return url ? (
                <Link
                  key={p.rank}
                  href={url}
                  target="_blank"
                  className="flex items-center gap-3.5 border-b border-[#f3f5f7] px-1.5 py-[11px] hover:bg-slate-50"
                >
                  {inner}
                </Link>
              ) : (
                <div
                  key={p.rank}
                  className="flex items-center gap-3.5 border-b border-[#f3f5f7] px-1.5 py-[11px] hover:bg-slate-50"
                >
                  {inner}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
