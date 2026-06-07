import type { Database } from "@/type/supabase";

export const RENT_TYPES = ["월세", "매매"] as const;
export const ROOM_TYPES = ["아파트", "스튜디오", "투룸"] as const;
export const AMENITIES = [
  "주차",
  "엘리베이터",
  "에어컨",
  "세탁기",
  "냉장고",
  "반려동물 허용",
  "금고",
  "TV",
  "인터넷",
  "수영장",
  "헬스장",
] as const;

export type Amenity = (typeof AMENITIES)[number];
export type RentType = (typeof RENT_TYPES)[number];
export type RoomType = (typeof ROOM_TYPES)[number];

export type Rental = Database["public"]["Tables"]["rentals"]["Row"];

export type RentSellerInfo = Pick<
  Database["public"]["Tables"]["users"]["Row"],
  "id" | "name" | "avatar_url" | "created_at"
>;

export type RentalWithPost = Rental & {
  posts: Database["public"]["Tables"]["posts"]["Row"] & {
    users: RentSellerInfo;
  };
};
