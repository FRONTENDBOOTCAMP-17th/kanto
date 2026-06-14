import type { Database } from "@/type/supabase";
import type { Post } from "@/type/post";
import type { SellerInfo } from "@/type/user";

export type Job = Database["public"]["Tables"]["jobs"]["Row"];

export type JobSellerInfo = SellerInfo & { auth_id: string | null };

export type JobDetail = Job & {
  posts: Post & {
    users: JobSellerInfo;
  };
};
