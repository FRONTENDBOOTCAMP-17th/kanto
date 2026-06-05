export interface User {
  id: number;
  phone: string | null;
  name: string;
  created_at: string;
  post_count: number | null;
  auth_id: string | null;
  email: string | null;
  avatar_url: string | null;
  // provider는 소셜로그인 제공자를 뜻합니다. kakao인지 google인지 facebook인지
  provider: string | null;
  updated_at: string | null;
  role: string;
}


// (중고마켓) 판매자 정보
export type SellerInfo = Pick<User, "id" | "name" | "created_at" | "avatar_url">;
