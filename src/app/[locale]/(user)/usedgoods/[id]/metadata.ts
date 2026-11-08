import type { Metadata } from "next";
import { getPublicUsedGoodsItem } from "@/services/usedGoods/usedGoods";
import { resolvePostId, encryptPostId } from "@/utils/postIdCipher";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const postId = resolvePostId(id);
  if (postId === null) return { title: "게시글을 찾을 수 없습니다", robots: { index: false } };

  // 페이지 본문과 같은 조회를 React cache로 공유한다 (쿠키를 읽지 않아 ISR 유지)
  const data = await getPublicUsedGoodsItem(postId).catch(() => null);

  if (!data?.posts) return { title: "게시글을 찾을 수 없습니다", robots: { index: false } };

  const title = data.posts?.title ?? "";
  const ogImage = (data.images as string[] | null)?.[0] ?? "/kantoLogo.png";

  return {
    title,
    description: data.content?.slice(0, 160),
    openGraph: {
      title,
      description: data.content?.slice(0, 160),
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
      type: "article",
    },
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_BASE_URL!.replace(/\/$/, "")}/usedgoods/${encryptPostId(postId)}`,
    },
  };
}
