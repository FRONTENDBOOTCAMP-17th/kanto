import Link from "next/link";
import { AdminPost, POST_TYPE_LABEL, getPostDetailUrl } from "@/services/admin/adminPosts";

interface AdminPostsTableProps {
  posts: AdminPost[];
  onToggle: (postId: number, currentStatus: string) => void;
  isPending: boolean;
}

export default function AdminPostsTable({ posts, onToggle, isPending }: AdminPostsTableProps) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="text-left">
          <tr className="bg-gray-200">
            <th className="pl-2 py-2">제목</th>
            <th className="pl-2 py-2">카테고리</th>
            <th className="pl-2 py-2">작성자</th>
            <th className="pl-2 py-2">조회수</th>
            <th className="pl-2 py-2">작성일</th>
            <th className="pl-2 py-2">상태</th>
          </tr>
        </thead>
        <tbody>
          {posts.map((post) => (
            <tr key={post.id} className="border">
              <td className="pl-2 py-2 max-w-70 truncate">
                {(() => {
                  const url = getPostDetailUrl(post.post_type, post.id);
                  return url ? (
                    <Link href={url} target="_blank" className="hover:underline">
                      {post.title}
                    </Link>
                  ) : (
                    post.title
                  );
                })()}
              </td>
              <td className="pl-2 py-2 whitespace-nowrap">
                {POST_TYPE_LABEL[post.post_type] ?? post.post_type}
              </td>
              <td className="pl-2 py-2">{post.author_name ?? "-"}</td>
              <td className="pl-2 py-2">{post.view_count ?? 0}</td>
              <td className="pl-2 py-2 whitespace-nowrap">{post.created_at?.split("T")[0]}</td>
              <td className="pl-2 py-2">
                <button
                  disabled={isPending}
                  onClick={() => onToggle(post.id, post.status)}
                  className={[
                    "rounded px-2 py-0.5 text-xs font-semibold transition-colors",
                    post.status === "active"
                      ? "bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700"
                      : "bg-gray-100 text-gray-500 hover:bg-green-100 hover:text-green-700",
                  ].join(" ")}
                >
                  {post.status === "active" ? "활성" : "비공개"}
                </button>
              </td>
            </tr>
          ))}
          {posts.length === 0 && (
            <tr>
              <td colSpan={6} className="py-8 text-center text-gray-400 text-sm">
                게시글이 없습니다.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
