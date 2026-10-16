import type { Metadata } from "next";
import { getJobDetail } from "@/services/job/jobDetail";
import { resolvePostId, encryptPostId } from "@/utils/postIdCipher";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const postId = resolvePostId(id);
  if (postId === null) return { title: "게시글을 찾을 수 없습니다", robots: { index: false } };

  let data;
  try {
    data = await getJobDetail(postId);
  } catch {
    return { title: "게시글을 찾을 수 없습니다", robots: { index: false } };
  }

  const title = data.posts.title;
  const ogImage = (data.images as string[] | null)?.[0] ?? "/kantoLogo.png";

  return {
    title,
    description: data.main_task?.slice(0, 160),
    openGraph: {
      title,
      description: data.main_task?.slice(0, 160),
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
      type: "article",
    },
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_BASE_URL!.replace(/\/$/, "")}/job/${encryptPostId(postId)}`,
    },
  };
}
