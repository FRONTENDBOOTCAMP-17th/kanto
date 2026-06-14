import type { Tables } from "@/type/supabase";
import type { Post } from "@/type/post";
import type { SellerInfo } from "@/type/user";

export type { TradeLocation } from "@/type/location";
export { TRADE_LOCATIONS } from "@/type/location";

export const PRODUCT_CATEGORIES = [
  { id: "all", label: "전체" },
  { id: "가구", label: "가구" },
  { id: "의류", label: "의류" },
  { id: "전자기기", label: "전자기기" },
  { id: "악세서리", label: "악세서리" },
  { id: "유아용품", label: "유아용품" },
  { id: "자동차", label: "자동차" },
  { id: "기타", label: "기타" },
] as const;

export const PRODUCT_CONDITIONS = [
  { id: "미개봉", label: "미개봉" },
  { id: "가벼운 사용감", label: "가벼운 사용감" },
  { id: "사용감 있음", label: "사용감 있음" },
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number]["id"];
export type ProductCondition = (typeof PRODUCT_CONDITIONS)[number]["id"];

export type UsedGoods = Tables<"used_goods">;

export interface UsedGoodsWithPost extends Post {
  used_goods: UsedGoods[];
  users: SellerInfo;
}
