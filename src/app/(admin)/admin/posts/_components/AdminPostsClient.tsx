"use client";

import { useState, useTransition } from "react";
import { Search } from "lucide-react";
import { AdminPost, POST_TYPE_LABEL } from "@/services/admin/adminPosts";
import AdminPostsTable from "./AdminPostsTable";
import AdminPostsCard from "./AdminPostsCard";
import { togglePostStatus } from "@/app/(admin)/admin/posts/_actions/togglePostStatus";

interface AdminPostsClientProps {
  posts: AdminPost[];
}

const CATEGORIES = ["전체", "중고거래", "구인구직", "방렌트", "커뮤니티"];

export default function AdminPostsClient({ posts }: AdminPostsClientProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("전체");
  const [items, setItems] = useState(posts);
  const [isPending, startTransition] = useTransition();

  const filtered = items.filter((post) => {
    const keyword = search.toLowerCase();
    const matchKeyword =
      post.title.toLowerCase().includes(keyword) ||
      (post.author_name?.toLowerCase().includes(keyword) ?? false);
    const matchCategory =
      category === "전체" || POST_TYPE_LABEL[post.post_type] === category;
    return matchKeyword && matchCategory;
  });

  function handleToggle(postId: number, currentStatus: string) {
    const nextStatus = currentStatus === "active" ? "inactive" : "active";
    startTransition(async () => {
      await togglePostStatus(postId, nextStatus);
      setItems((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, status: nextStatus } : p))
      );
    });
  }

  return (
    <div>
      <h1 className="text-4xl font-bold">글 관리</h1>
      <p className="my-4">총 {items.length}개의 게시글이 있습니다.</p>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-300 w-4 h-4" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="제목 또는 작성자로 검색..."
            className="border rounded-lg border-gray-300 py-2 pl-8 pr-3 text-sm"
          />
        </div>
        <div className="flex gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={[
                "rounded-lg px-3 py-1.5 text-sm font-medium border transition-colors",
                category === cat
                  ? "bg-teal-500 text-white border-teal-500"
                  : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50",
              ].join(" ")}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="hidden md:block">
        <AdminPostsTable posts={filtered} onToggle={handleToggle} isPending={isPending} />
      </div>
      <div className="md:hidden">
        <AdminPostsCard posts={filtered} onToggle={handleToggle} isPending={isPending} />
      </div>
    </div>
  );
}
