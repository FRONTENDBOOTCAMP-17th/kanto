import { revalidatePath } from "next/cache";

export type RevalidatablePostType = "used_goods" | "rental" | "jobs";

// 게시물 상세(ISR) 페이지 패턴. 특정 id 하나가 아니라 해당 유형의 상세 페이지 캐시 전체를
// 무효화한다(다음 방문 때 재생성). 로케일·암호화 토큰 URL 조합을 일일이 계산하지 않기 위함.
const DETAIL_ROUTE: Record<RevalidatablePostType, string> = {
  used_goods: "/[locale]/(user)/usedgoods/[id]",
  rental: "/[locale]/(user)/rental/[id]",
  jobs: "/[locale]/(user)/job/[id]",
};

export function revalidatePostPages(postType: string) {
  const route = DETAIL_ROUTE[postType as RevalidatablePostType];
  if (route) revalidatePath(route, "page");
  // 메인 인기 게시물에도 노출될 수 있다
  revalidatePath("/[locale]/(user)/main", "page");
}
