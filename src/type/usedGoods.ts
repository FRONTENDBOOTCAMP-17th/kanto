import type { Post } from "./post";
import type { SellerInfo } from "./user";

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

export const TRADE_LOCATIONS = [
  "BGC / Taguig",
  "Makati",
  "Pasay / Paranaque",
  "Quezon City",
  "Mandaluyong / Pasig",
  "Pampanga",
  "그 외 지역",
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];
export type ProductCondition = (typeof PRODUCT_CONDITIONS)[number];
export type TradeLocation = (typeof TRADE_LOCATIONS)[number];

type StandardLocation = Exclude<TradeLocation, "그 외 지역">;

type UsedGoodsLocation =
  | { location_type: StandardLocation; location_custom: null }
  | { location_type: "그 외 지역"; location_custom: string };

export type UsedGoods = {
  id: number;
  post_id: number;
  price: number;
  category: ProductCategory;
  condition: ProductCondition;
  safe_payment: boolean | null;
  content: string;
  images: string[] | null;
} & UsedGoodsLocation;

export interface UsedGoodsWithPost extends Post {
  used_goods: UsedGoods[];
  users: SellerInfo;
}

/* 
 사용전 참고사항
 used_goods는 중고 마켓 Post 또는 상품 정보에 대한 타입값입니다.
 users는 판매자 정보를 정의해 놓은 타입값입니다. 
*/