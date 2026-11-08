import { notFound } from "next/navigation";

// 존재하지 않는 경로를 크롤러가 반복 요청해도 매번 렌더링하지 않도록 404 결과를 캐시한다.
export const revalidate = 86400;

export function generateStaticParams() {
  return [];
}

// 매칭되지 않는 경로를 [locale]/not-found.tsx(번역·전역 레이아웃 포함)로 보낸다.
export default function CatchAllPage() {
  notFound();
}
