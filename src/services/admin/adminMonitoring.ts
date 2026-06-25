import { createAdminClient } from "@/utils/supabase/admin";
import { REPORTS_TABLE, REPORT_STATUS } from "@/constants/report";
import { POST_TYPE_LABEL } from "@/app/(admin)/admin/_lib/constants";
import { fillDailyGaps } from "@/app/(admin)/admin/_lib/utils";

export interface MonitoringStats {
  totalUsers: number;
  newToday: number;
  dau: number;
  mau: number;
  totalPosts: number;
  newPostsToday: number;
  pendingReports: number;
  totalSanctions: number;

  dailySignups: { day: string; count: number }[];
  monthlySignups: { month: string; count: number }[];
  yearlySignups: { year: string; count: number }[];

  postTypes: { name: string; count: number; pct: string }[];
  regions: { name: string; count: number }[];
}

export async function getMonitoringStats(): Promise<MonitoringStats> {
  const admin = createAdminClient();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = today.toISOString();

  const [
    totalUsersRes,
    newTodayRes,
    dauRes,
    mauRes,
    totalPostsRes,
    newPostsTodayRes,
    pendingReportsRes,
    totalSanctionsRes,
    signups30Res,
    signups365Res,
    allUsersCreatedRes,
    postTypesRes,
    regionsRes,
  ] = await Promise.all([
    admin.from("users").select("*", { count: "exact", head: true }).is("deleted_at", null),
    admin.from("users").select("*", { count: "exact", head: true }).gte("created_at", todayISO).is("deleted_at", null),
    admin.rpc("get_active_users_count", { days: 1 }),
    admin.rpc("get_active_users_count", { days: 30 }),
    admin.from("posts").select("*", { count: "exact", head: true }).eq("status", "active"),
    admin.from("posts").select("*", { count: "exact", head: true }).eq("status", "active").gte("created_at", todayISO),
    admin.from(REPORTS_TABLE).select("*", { count: "exact", head: true }).eq("status", REPORT_STATUS.PENDING),
    admin.from("user_sanctions").select("*", { count: "exact", head: true }),
    admin.rpc("get_daily_signups", { days: 30 }),
    admin.rpc("get_daily_signups", { days: 365 }),
    admin.from("users").select("created_at").is("deleted_at", null),
    admin.from("posts").select("post_type").eq("status", "active"),
    admin.rpc("get_region_post_counts", { days: 30 }),
  ]);

  // Daily signups — fill gaps so chart is always 30 points
  const dailySignups = fillDailyGaps(
    (signups30Res.data ?? []) as { day: string; count: number }[],
    30,
  );

  // Monthly signups — aggregate 365-day data by month, last 12 months
  const monthlyMap = new Map<string, number>();
  for (const { day, count } of (signups365Res.data ?? []) as { day: string; count: number }[]) {
    const d = new Date(day);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthlyMap.set(key, (monthlyMap.get(key) ?? 0) + Number(count));
  }
  const monthlySignups: { month: string; count: number }[] = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth() - (11 - i), 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    return { month: key, count: monthlyMap.get(key) ?? 0 };
  });

  // Yearly signups — aggregate from all user created_at
  const yearlyMap = new Map<string, number>();
  for (const { created_at } of (allUsersCreatedRes.data ?? []) as { created_at: string }[]) {
    const year = String(new Date(created_at).getFullYear());
    yearlyMap.set(year, (yearlyMap.get(year) ?? 0) + 1);
  }
  const yearlySignups = Array.from(yearlyMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([year, count]) => ({ year, count }));

  // Post type distribution
  const postTypesRaw = (postTypesRes.data ?? []) as { post_type: string }[];
  const typeMap: Record<string, number> = {};
  for (const { post_type } of postTypesRaw) {
    const label = POST_TYPE_LABEL[post_type] ?? "기타";
    typeMap[label] = (typeMap[label] ?? 0) + 1;
  }
  const total = postTypesRaw.length || 1;
  const postTypes = Object.entries(typeMap)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count, pct: `${Math.round((count / total) * 100)}%` }));

  // Regions
  const regions = ((regionsRes.data ?? []) as { location: string; count: number }[])
    .map((r) => ({ name: r.location, count: Number(r.count) }));

  return {
    totalUsers: totalUsersRes.count ?? 0,
    newToday: newTodayRes.count ?? 0,
    dau: Number(dauRes.data?.[0]?.count ?? 0),
    mau: Number(mauRes.data?.[0]?.count ?? 0),
    totalPosts: totalPostsRes.count ?? 0,
    newPostsToday: newPostsTodayRes.count ?? 0,
    pendingReports: pendingReportsRes.count ?? 0,
    totalSanctions: totalSanctionsRes.count ?? 0,
    dailySignups,
    monthlySignups,
    yearlySignups,
    postTypes,
    regions,
  };
}

export interface SentryIssue {
  id: string;
  title: string;
  culprit: string;
  count: string;
  level: "error" | "warning" | "info";
  lastSeen: string;
  firstSeen: string;
  isNew: boolean;
  permalink: string;
}

export interface SentryResult {
  configured: boolean;
  issues: SentryIssue[];
}

export async function getSentryIssues(): Promise<SentryResult> {
  const token = process.env.SENTRY_AUTH_TOKEN;
  const org = process.env.SENTRY_ORG;
  const project = process.env.SENTRY_PROJECT;

  if (!token || !org || !project) {
    return { configured: false, issues: [] };
  }

  try {
    const res = await fetch(
      `https://sentry.io/api/0/projects/${org}/${project}/issues/?limit=10&query=is:unresolved&sort=date`,
      {
        headers: { Authorization: `Bearer ${token}` },
        next: { revalidate: 60 },
      },
    );
    if (!res.ok) return { configured: true, issues: [] };
    const data = await res.json();
    return { configured: true, issues: data as SentryIssue[] };
  } catch {
    return { configured: true, issues: [] };
  }
}
