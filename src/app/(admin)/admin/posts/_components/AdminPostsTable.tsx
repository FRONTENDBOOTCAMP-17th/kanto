import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import {
  AdminPost,
  POST_TYPE_LABEL,
  getPostDetailUrl,
} from "@/services/admin/adminPosts";

interface AdminPostsTableProps {
  posts: AdminPost[];
  onOpen: (postId: number) => void;
  selectedIds: Set<number>;
  onToggleSelect: (id: number) => void;
  onToggleSelectAll: () => void;
  allSelected: boolean;
}

const CATEGORY_STYLE: Record<string, { bg: string; fg: string }> = {
  used_goods: { bg: "#f0fdfa", fg: "#0d9488" },
  jobs: { bg: "#faf5ff", fg: "#7c3aed" },
  rental: { bg: "#eff6ff", fg: "#2563eb" },
  community: { bg: "#fff7ed", fg: "#c2410c" },
};

function formatDate(date: string | null) {
  if (!date) return "-";
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(date));
}

export default function AdminPostsTable({
  posts,
  onOpen,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  allSelected,
}: AdminPostsTableProps) {
  return (
    <table className="w-full min-w-[760px] border-collapse">
      <thead>
        <tr className="border-b border-[#f1f4f6] bg-slate-50">
          <th className="w-[44px] px-[18px] py-[13px] text-left">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={onToggleSelectAll}
              className="h-4 w-4 cursor-pointer align-middle accent-teal-500"
            />
          </th>
          {["제목", "카테고리", "작성자", "조회", "작성일"].map((h) => (
            <th
              key={h}
              className="px-[18px] py-[13px] text-left text-[12px] font-bold uppercase tracking-wide text-slate-400"
            >
              {h}
            </th>
          ))}
          <th className="px-[18px] py-[13px] text-right text-[12px] font-bold uppercase tracking-wide text-slate-400">
            액션
          </th>
        </tr>
      </thead>
      <tbody>
        {posts.map((post) => {
          const cat = CATEGORY_STYLE[post.post_type];
          const url = getPostDetailUrl(post.post_type, post.id);
          const isActive = post.status === "active";
          return (
            <tr
              key={post.id}
              className="border-t border-[#f3f5f7] hover:bg-slate-50"
            >
              <td className="px-[18px] py-[15px]">
                <input
                  type="checkbox"
                  checked={selectedIds.has(post.id)}
                  onChange={() => onToggleSelect(post.id)}
                  className="h-4 w-4 cursor-pointer align-middle accent-teal-500"
                />
              </td>
              <td className="px-[18px] py-[15px]">
                {url ? (
                  <Link
                    href={url}
                    target="_blank"
                    className="group inline-flex max-w-[320px] cursor-pointer items-center gap-1.5 text-[14px] font-bold text-slate-900"
                  >
                    <span className="truncate">{post.title}</span>
                    <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-slate-300 transition-colors group-hover:text-teal-600" />
                  </Link>
                ) : (
                  <span className="block max-w-[320px] truncate text-[14px] font-bold text-slate-900">
                    {post.title}
                  </span>
                )}
              </td>
              <td className="px-[18px] py-[15px]">
                <span
                  className="inline-flex items-center whitespace-nowrap rounded-full px-[11px] py-1 text-[12px] font-semibold"
                  style={
                    cat
                      ? { background: cat.bg, color: cat.fg }
                      : { background: "#f1f5f9", color: "#64748b" }
                  }
                >
                  {POST_TYPE_LABEL[post.post_type] ?? post.post_type}
                </span>
              </td>
              <td className="whitespace-nowrap px-[18px] py-[15px] text-[13.5px] text-slate-500">
                {post.author_name ?? "-"}
              </td>
              <td className="whitespace-nowrap px-[18px] py-[15px] text-[13.5px] font-semibold text-slate-600">
                {(post.view_count ?? 0).toLocaleString()}
              </td>
              <td className="whitespace-nowrap px-[18px] py-[15px] text-[13.5px] text-slate-500">
                {formatDate(post.created_at)}
              </td>
              <td className="px-[18px] py-[15px]">
                <div className="flex items-center justify-end">
                  <button
                    onClick={() => onOpen(post.id)}
                    className={[
                      "cursor-pointer whitespace-nowrap rounded-[9px] px-4 py-2 text-[13px]",
                      isActive
                        ? "border border-[#e2e8eb] bg-white font-semibold text-slate-600"
                        : "border-none bg-teal-500 font-bold text-white",
                    ].join(" ")}
                  >
                    {isActive ? "상세" : "검토"}
                  </button>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
