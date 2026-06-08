import type { Tables } from "@/type/supabase";

export type User = Tables<"users">;

export type SellerInfo = Pick<User, "id" | "name" | "created_at" | "avatar_url">;
