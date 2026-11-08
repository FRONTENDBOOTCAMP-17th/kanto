import type { MetadataRoute } from "next";
import { createAdminClient } from "@/utils/supabase/admin";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL!.replace(/\/$/, "");

// 크롤러가 sitemap을 반복 요청해도 함수 실행·DB 조회가 일어나지 않도록 하루 단위 ISR로 캐시한다.
export const revalidate = 86400;

type SitemapRow = { id: number; updated_at: string | null; created_at: string };

async function getActivePosts() {
  try {
    const supabase = createAdminClient();
    const query = (postType: "used_goods" | "rental" | "jobs") =>
      supabase
        .from("posts")
        .select("id, updated_at, created_at")
        .eq("post_type", postType)
        .eq("status", "active");
    return await Promise.all([query("used_goods"), query("rental"), query("jobs")]);
  } catch {
    // 빌드 환경 등 DB에 접근할 수 없으면 정적 경로만 내보내고, ISR 재생성 때 다시 채운다.
    const empty = { data: [] as SitemapRow[] };
    return [empty, empty, empty] as const;
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [usedGoods, rentals, jobs] = await getActivePosts();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/main`, lastModified: new Date(), priority: 1 },
    { url: `${BASE_URL}/usedgoods`, lastModified: new Date(), priority: 0.9 },
    { url: `${BASE_URL}/rental`, lastModified: new Date(), priority: 0.9 },
    { url: `${BASE_URL}/job`, lastModified: new Date(), priority: 0.9 },
  ];

  const dynamicRoutes: MetadataRoute.Sitemap = [
    ...(usedGoods.data ?? []).map((item) => ({
      url: `${BASE_URL}/usedgoods/${item.id}`,
      lastModified: new Date(item.updated_at ?? item.created_at),
      priority: 0.7,
    })),
    ...(rentals.data ?? []).map((item) => ({
      url: `${BASE_URL}/rental/${item.id}`,
      lastModified: new Date(item.updated_at ?? item.created_at),
      priority: 0.7,
    })),
    ...(jobs.data ?? []).map((item) => ({
      url: `${BASE_URL}/job/${item.id}`,
      lastModified: new Date(item.updated_at ?? item.created_at),
      priority: 0.7,
    })),
  ];

  return [...staticRoutes, ...dynamicRoutes];
}
