import type { Tables } from "@/type/supabase";
import type { Post } from "../post";
import type { SellerInfo } from "../user";

export const RENTAL_ROOM_TYPES = [
  { id: "all", label: "전체" },
  { id: "아파트", label: "아파트" },
  { id: "스튜디오", label: "스튜디오" },
  { id: "원룸", label: "원룸" },
  { id: "투룸", label: "투룸" },
] as const;

export type RoomTypeId = (typeof RENTAL_ROOM_TYPES)[number]["id"];

export const RENTAL_RENT_TYPES = [
  { id: "all" },
  { id: "매매" },
  { id: "월세" },
] as const;

export type RentTypeId = (typeof RENTAL_RENT_TYPES)[number]["id"];

export type Rental = Tables<"rentals">;

export interface RentalWithPost extends Post {
  rentals: Rental[];
  users: SellerInfo;
}
