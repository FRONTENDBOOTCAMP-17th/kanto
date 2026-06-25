import Link from "next/link";
import {
  ArrowUpRight,
  CalendarDays,
  User,
} from "lucide-react";
import {
  AdminPost,
  POST_TYPE_LABEL,
  getPostDetailUrl,
} from "@/services/admin/adminPosts";
import { formatDate } from "@/utils/formatTime";

interface AdminPostsCardProps {
  posts: AdminPost[];
  onToggle: (postId: number, currentStatus: string) => void;
  isPending: boolean;
}

function formatDate(date: string | null) {
  if (!date) return "-";
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(date));
}

export default function AdminPostsCard({
  posts,
  onToggle,
  isPending,
}: AdminPostsCardProps) {
  if (posts.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[#d7dee3] bg-white px-5 py-12 text-center">
        <p className="text-sm font-bold text-slate-700">
          조건에 맞는 게시글이 없습니다.
        </p>
        <p className="mt-1 text-sm text-slate-400">
          검색어를 줄이거나 다른 카테고리를 선택해 보세요.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {posts.map((post) => (
        <div
          key={post.id}
          className="rounded-lg border border-[#e7ebee] bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)]"
        >
          <div className="flex items-start justify-between gap-3">
            {(() => {
              const url = getPostDetailUrl(post.post_type, post.id);
              return url ? (
                <Link
                  href={url}
                  target="_blank"
                  className="group flex min-w-0 items-start gap-1.5 text-base font-extrabold leading-snug text-slate-900"
                >
                  <span className="line-clamp-2">{post.title}</span>
                  <ArrowUpRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-300 group-hover:text-teal-600" />
                </Link>
              ) : (
                <h3 className="line-clamp-2 text-base font-extrabold leading-snug text-slate-900">
                  {post.title}
                </h3>
              );
            })()}
            <button
              disabled={isPending}
              onClick={() => onToggle(post.id, post.status)}
              className={[
                "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-60",
                post.status === "active"
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-slate-100 text-slate-500",
              ].join(" ")}
            >
              {post.status === "active" ? "활성" : "비공개"}
            </button>
          </div>

          <span className="mt-3 inline-flex rounded-md bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-700">
            {POST_TYPE_LABEL[post.post_type] ?? post.post_type}
          </span>

          <div className="mt-4 grid grid-cols-3 gap-2 text-sm text-slate-500">
            <span className="flex min-w-0 items-center gap-1.5">
              <User className="h-4 w-4 shrink-0" />
              <span className="truncate">{post.author_name ?? "-"}</span>
            </span>
            <span className="font-semibold text-slate-600">
              {(post.view_count ?? 0).toLocaleString()}
            </span>
            <span className="flex items-center justify-end gap-1.5 whitespace-nowrap">
              <CalendarDays className="h-4 w-4 shrink-0" />
              {formatDate(post.created_at)}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
