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

  
  const dailySignups = fillDailyGaps(
    (signups30Res.data ?? []) as { day: string; count: number }[],
    30,
  );

  
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

  
  const yearlyMap = new Map<string, number>();
  for (const { created_at } of (allUsersCreatedRes.data ?? []) as { created_at: string }[]) {
    const year = String(new Date(created_at).getFullYear());
    yearlyMap.set(year, (yearlyMap.get(year) ?? 0) + 1);
  }
  const yearlySignups = Array.from(yearlyMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([year, count]) => ({ year, count }));

  
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

export interface SentryTransaction {
  transaction: string;
  count: number;
  avgDuration: number;
  p95Duration: number;
  failureRate: number;
}

export interface SentryWebVitals {
  lcp: number | null;
  fcp: number | null;
  cls: number | null;
  ttfb: number | null;
}

export interface SentryPerformance {
  configured: boolean;
  transactions: SentryTransaction[];
  webVitals: SentryWebVitals;
}

export async function getSentryPerformance(): Promise<SentryPerformance> {
  const token = process.env.SENTRY_AUTH_TOKEN;
  const org = process.env.SENTRY_ORG;

  if (!token || !org) return { configured: false, transactions: [], webVitals: { lcp: null, fcp: null, cls: null, ttfb: null } };

  try {
    const txParams = new URLSearchParams({ dataset: "discover", query: "event.type:transaction !transaction:*sentry* !transaction:*supabase*", sort: "-count()", limit: "10", statsPeriod: "24h" });
    ["transaction", "count()", "avg(transaction.duration)", "p95(transaction.duration)", "failure_rate()"].forEach((f) => txParams.append("field", f));

    const vitalParams = new URLSearchParams({ dataset: "discover", query: "event.type:transaction transaction.op:pageload", limit: "1", statsPeriod: "24h" });
    ["p75(measurements.lcp)", "p75(measurements.fcp)", "p75(measurements.cls)", "p75(measurements.ttfb)"].forEach((f) => vitalParams.append("field", f));

    const [txRes, vitalRes] = await Promise.all([
      fetch(`https://sentry.io/api/0/organizations/${org}/events/?${txParams}`, { headers: { Authorization: `Bearer ${token}` }, next: { revalidate: 60 } }),
      fetch(`https://sentry.io/api/0/organizations/${org}/events/?${vitalParams}`, { headers: { Authorization: `Bearer ${token}` }, next: { revalidate: 60 } }),
    ]);

    const txData = txRes.ok ? await txRes.json() : { data: [] };
    const vitalData = vitalRes.ok ? await vitalRes.json() : { data: [] };

    const transactions: SentryTransaction[] = (txData.data ?? [])
      .filter((r: Record<string, unknown>) => !String(r.transaction).startsWith("https://"))
      .map((r: Record<string, unknown>) => ({
        transaction: String(r.transaction),
        count: Number(r["count()"]),
        avgDuration: Math.round(Number(r["avg(transaction.duration)"])),
        p95Duration: Math.round(Number(r["p95(transaction.duration)"])),
        failureRate: Number(r["failure_rate()"]),
      }));

    const v = vitalData.data?.[0] ?? {};
    const webVitals: SentryWebVitals = {
      lcp: v["p75(measurements.lcp)"] != null ? Math.round(Number(v["p75(measurements.lcp)"])) : null,
      fcp: v["p75(measurements.fcp)"] != null ? Math.round(Number(v["p75(measurements.fcp)"])) : null,
      cls: v["p75(measurements.cls)"] != null ? Number(Number(v["p75(measurements.cls)"]).toFixed(3)) : null,
      ttfb: v["p75(measurements.ttfb)"] != null ? Math.round(Number(v["p75(measurements.ttfb)"])) : null,
    };

    return { configured: true, transactions, webVitals };
  } catch {
    return { configured: true, transactions: [], webVitals: { lcp: null, fcp: null, cls: null, ttfb: null } };
  }
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
