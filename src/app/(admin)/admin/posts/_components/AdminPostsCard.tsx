import Link from "next/link";
import { ArrowUpRight, CalendarDays, User } from "lucide-react";
import {
  AdminPost,
  POST_TYPE_LABEL,
  getPostDetailUrl,
} from "@/services/admin/adminPosts";
import { formatDate } from "@/utils/formatTime";

interface AdminPostsCardProps {
  posts: AdminPost[];
  onOpen: (postId: number) => void;
}

export default function AdminPostsCard({ posts, onOpen }: AdminPostsCardProps) {
  return (
    <div className="space-y-3 p-4">
      {posts.map((post) => {
        const url = getPostDetailUrl(post.post_type, post.id);
        const isActive = post.status === "active";
        return (
          <div
            key={post.id}
            className="rounded-[14px] border border-[#e7ebee] bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                {url ? (
                  <Link
                    href={url}
                    target="_blank"
                    className="group flex items-start gap-1.5 text-[15px] font-extrabold leading-snug text-slate-900"
                  >
                    <span className="line-clamp-2">{post.title}</span>
                    <ArrowUpRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-300 group-hover:text-teal-600" />
                  </Link>
                ) : (
                  <h3 className="line-clamp-2 text-[15px] font-extrabold leading-snug text-slate-900">
                    {post.title}
                  </h3>
                )}
              </div>
              <span
                className={[
                  "inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[11px] font-bold",
                  isActive
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-slate-100 text-slate-500",
                ].join(" ")}
              >
                {isActive ? "활성" : "비공개"}
              </span>
            </div>

            <div className="mt-3 flex items-center justify-between gap-2">
              <span className="inline-flex rounded-full bg-teal-50 px-2.5 py-1 text-[11px] font-bold text-teal-700">
                {POST_TYPE_LABEL[post.post_type] ?? post.post_type}
              </span>
              <button
                onClick={() => onOpen(post.id)}
                className={[
                  "cursor-pointer rounded-[9px] px-3.5 py-1.5 text-[12px]",
                  isActive
                    ? "border border-[#e2e8eb] bg-white font-semibold text-slate-600"
                    : "bg-teal-500 font-bold text-white",
                ].join(" ")}
              >
                {isActive ? "상세" : "검토"}
              </button>
            </div>

            <div className="mt-3 flex items-center gap-3 text-[12.5px] text-slate-500">
              <span className="flex items-center gap-1">
                <User className="h-3.5 w-3.5 shrink-0" />
                <span className="max-w-22.5 truncate">{post.author_name ?? "-"}</span>
              </span>
              <span className="font-semibold text-slate-600">
                조회 {(post.view_count ?? 0).toLocaleString()}
              </span>
              <span className="ml-auto flex items-center gap-1 whitespace-nowrap">
                <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                {formatDate(post.created_at)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
