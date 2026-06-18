import Link from "next/link";
import { Eye, CalendarDays, User } from "lucide-react";
import { AdminPost, POST_TYPE_LABEL, getPostDetailUrl } from "@/services/admin/adminPosts";

interface AdminPostsCardProps {
  posts: AdminPost[];
  onToggle: (postId: number, currentStatus: string) => void;
  isPending: boolean;
}

export default function AdminPostsCard({ posts, onToggle, isPending }: AdminPostsCardProps) {
  if (posts.length === 0) {
    return (
      <p className="py-8 text-center text-gray-400 text-sm">게시글이 없습니다.</p>
    );
  }

  return (
    <div className="space-y-3">
      {posts.map((post) => (
        <div
          key={post.id}
          className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm"
        >
          <div className="flex items-start justify-between gap-2">
            {(() => {
              const url = getPostDetailUrl(post.post_type, post.id);
              return url ? (
                <Link href={url} target="_blank" className="text-base font-bold text-gray-900 line-clamp-2 hover:underline">
                  {post.title}
                </Link>
              ) : (
                <h3 className="text-base font-bold text-gray-900 line-clamp-2">{post.title}</h3>
              );
            })()}
            <button
              disabled={isPending}
              onClick={() => onToggle(post.id, post.status)}
              className={[
                "shrink-0 rounded px-2 py-0.5 text-xs font-semibold",
                post.status === "active"
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-500",
              ].join(" ")}
            >
              {post.status === "active" ? "활성" : "비공개"}
            </button>
          </div>

          <span className="mt-1 inline-block rounded-md bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-600">
            {POST_TYPE_LABEL[post.post_type] ?? post.post_type}
          </span>

          <div className="mt-3 flex flex-wrap gap-3 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <User className="w-4 h-4" />
              {post.author_name ?? "-"}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              {post.view_count ?? 0}
            </span>
            <span className="flex items-center gap-1">
              <CalendarDays className="w-4 h-4" />
              {post.created_at?.split("T")[0]}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
