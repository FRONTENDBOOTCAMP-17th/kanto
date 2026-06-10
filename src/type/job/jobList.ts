import type { Tables } from "@/type/supabase";
import type { Post } from "@/type/post";
import type { SellerInfo } from "@/type/user";

export type Job = Tables<"jobs">;

export interface JobWithPost extends Post {
  jobs: Job[];
  users: SellerInfo;
}
