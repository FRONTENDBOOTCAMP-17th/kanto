import type { Tables } from "@/type/supabase";
import type { Post } from "../post";
import type { SellerInfo } from "../user";

export const RENTAL_ROOM_TYPES = [
  { id: "all", label: "전체" },
  { id: "studio", label: "원룸" },
  { id: "tworoom", label: "투룸" },
  { id: "condo", label: "콘도" },
] as const;

export type RoomTypeId = (typeof RENTAL_ROOM_TYPES)[number]["id"];

export type Rental = Tables<"rentals">;

export interface RentalWithPost extends Post {
  rentals: Rental[];
  users: SellerInfo;
}
