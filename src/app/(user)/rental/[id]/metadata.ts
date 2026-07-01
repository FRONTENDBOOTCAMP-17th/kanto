import type { Metadata } from "next";
import { createClient } from "@/utils/supabase/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: number }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("rentals")
    .select("description, images, posts!inner(title)")
    .eq("post_id", id)
    .single();

  if (!data) return { title: "게시글을 찾을 수 없습니다", robots: { index: false } };

  const title = (data.posts as { title: string }).title;
  const ogImage = (data.images as string[] | null)?.[0] ?? "/og-image.png";

  return {
    title,
    description: data.description?.slice(0, 160) ?? undefined,
    openGraph: {
      title,
      description: data.description?.slice(0, 160) ?? undefined,
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
      type: "article",
    },
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_BASE_URL!.replace(/\/$/, "")}/rental/${id}`,
    },
  };
}
