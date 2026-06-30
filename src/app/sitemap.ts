import type { MetadataRoute } from "next";
import { createAdminClient } from "@/utils/supabase/admin";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL!;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createAdminClient();

  const [usedGoods, rentals, jobs] = await Promise.all([
    supabase
      .from("posts")
      .select("id, updated_at, created_at")
      .eq("post_type", "used_goods")
      .eq("status", "active"),
    supabase
      .from("posts")
      .select("id, updated_at, created_at")
      .eq("post_type", "rental")
      .eq("status", "active"),
    supabase
      .from("posts")
      .select("id, updated_at, created_at")
      .eq("post_type", "jobs")
      .eq("status", "active"),
  ]);

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
