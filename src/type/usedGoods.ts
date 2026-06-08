import type { Tables } from "@/type/supabase";
import type { Post } from "./post";
import type { SellerInfo } from "./user";

export type { TradeLocation } from "./location";
export { TRADE_LOCATIONS } from "./location";

export const PRODUCT_CATEGORIES = [
  "가구",
  "의류",
  "악세서리",
  "유아용품",
  "자동차",
  "기타",
] as const;

export const PRODUCT_CONDITIONS = [
  "미개봉",
  "가벼운 사용감",
  "사용감 있음",
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];
export type ProductCondition = (typeof PRODUCT_CONDITIONS)[number];

export type UsedGoods = Tables<"used_goods">;

export interface UsedGoodsWithPost extends Post {
  used_goods: UsedGoods[];
  users: SellerInfo;
}
