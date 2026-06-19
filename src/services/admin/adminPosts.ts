import { createAdminClient } from "@/utils/supabase/admin";

export interface AdminPost {
  id: number;
  title: string;
  post_type: string;
  status: string;
  view_count: number | null;
  created_at: string | null;
  author_name: string | null;
  handled_by_name: string | null;
  handled_at: string | null;
}

const POST_TYPE_LABEL: Record<string, string> = {
  used_goods: "중고거래",
  jobs: "구인구직",
  rental: "방 렌탈",
  community: "커뮤니티",
};

export { POST_TYPE_LABEL };

const POST_TYPE_PATH: Record<string, string> = {
  used_goods: "usedgoods",
  jobs: "job",
  rental: "rental",
};

export function getPostDetailUrl(
  postType: string,
  postId: number
): string | null {
  const path = POST_TYPE_PATH[postType];
  if (!path) return null;
  return `/${path}/${postId}`;
}

export async function getAdminPosts(): Promise<AdminPost[]> {
  const admin = await createAdminClient();

  const { data, error } = await admin
    .from("posts")
    .select(
      "id, title, post_type, status, view_count, created_at, handled_at, author:users!posts_user_id_fkey(name), admin_user:users!posts_handled_by_fkey(name)"
    )
    .order("created_at", { ascending: false }) as unknown as {
      data: Array<{
        id: number;
        title: string;
        post_type: string;
        status: string;
        view_count: number | null;
        created_at: string | null;
        handled_at: string | null;
        author: { name: string } | null;
        admin_user: { name: string } | null;
      }> | null;
      error: unknown;
    };

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    post_type: row.post_type,
    status: row.status,
    view_count: row.view_count,
    created_at: row.created_at,
    author_name: row.author?.name ?? null,
    handled_by_name: row.admin_user?.name ?? null,
    handled_at: row.handled_at ?? null,
  }));
}

export async function setPostStatus(
  postId: number,
  status: "active" | "inactive"
) {
  const admin = await createAdminClient();
  const { error } = await admin
    .from("posts")
    .update({ status })
    .eq("id", postId);
  if (error) throw error;
}
