"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText } from "lucide-react";
import { FilterDropdown } from "@/components/common/FilterDropdown";
import { ROUTES } from "@/constants/routes";
import { POST_TYPE_LABEL } from "@/app/(admin)/admin/_lib/constants";
import type { Post } from "@/type/post";

type UserPost = Pick<
  Post,
  "id" | "title" | "post_type" | "view_count" | "created_at"
>;

interface AdminUsersPostsProps {
  posts: UserPost[];
}

const CATEGORY_OPTIONS = [
  { id: "all", label: "전체" },
  { id: "used_goods", label: "중고거래" },
  { id: "jobs", label: "구인구직" },
  { id: "rental", label: "부동산" },
] as const;

const POST_TYPE_BADGE: Record<string, string> = {
  used_goods: "bg-violet-50 text-violet-600",
  jobs: "bg-amber-50 text-amber-600",
  rental: "bg-sky-50 text-sky-600",
};

const POST_TYPE_PATH: Record<string, string> = {
  used_goods: ROUTES.usedgoods,
  jobs: ROUTES.jobs,
  rental: ROUTES.rental,
};

export default function AdminUsersPosts({ posts }: AdminUsersPostsProps) {
  const [category, setCategory] = useState("all");

  const filteredPosts =
    category === "all"
      ? posts
      : posts.filter((post) => post.post_type === category);

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
          <FileText className="h-6 w-6" />
          작성한 글 ({filteredPosts.length})
        </h2>
        <FilterDropdown
          options={CATEGORY_OPTIONS}
          value={category}
          onChange={setCategory}
          align="right"
        />
      </div>

      {filteredPosts.length === 0 ? (
        <p className="py-8 text-center text-gray-500">작성한 글이 없습니다.</p>
      ) : (
        <ul>
          {filteredPosts.map((post) => (
            <li
              key={post.id}
              className="border-b border-gray-100 last:border-b-0"
            >
              <Link
                href={`${POST_TYPE_PATH[post.post_type] ?? ""}/${post.id}`}
                className="-mx-2 flex items-center justify-between rounded-lg px-2 py-4 transition-colors hover:bg-gray-50"
              >
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-3">
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-medium ${
                        POST_TYPE_BADGE[post.post_type] ??
                        "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {POST_TYPE_LABEL[post.post_type] ?? post.post_type}
                    </span>
                    <span className="text-sm text-gray-500">
                      {post.created_at?.split("T")[0] ?? "-"}
                    </span>
                  </div>
                  <p className="truncate font-medium text-gray-900">
                    {post.title}
                  </p>
                </div>
                <span className="ml-4 shrink-0 text-sm text-gray-400">
                  조회 {post.view_count}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
