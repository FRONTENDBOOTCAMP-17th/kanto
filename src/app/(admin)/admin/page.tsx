import { createAdminClient } from "@/utils/supabase/admin";
import { REPORTS_TABLE, REPORT_STATUS } from "@/constants/report";
import {
  POST_TYPE_LABEL,
  CAT_ORDER,
  REPORT_COLORS,
} from "./_lib/constants";
import { normalizeReason, fillDailyGaps, daysSince } from "./_lib/utils";
import type { Category, ReportedUser, ReportedPost } from "@/type/admin";
import HeaderSection from "./_components/HeaderSection";
import UrgentReportBanner from "./_components/UrgentReportBanner";
import KpiCards from "./_components/KpiCards";
import TrendAndDonut from "./_components/TrendAndDonut";
import RegionAndTopPosts from "./_components/RegionAndTopPosts";
import ReportQueue from "./_components/ReportQueue";
import ReportTypes from "./_components/ReportTypes";
import DashboardReportCenter from "./_components/DashboardReportCenter";

export default async function DashboardPage() {
  const admin = createAdminClient();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayISO = todayStart.toISOString();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400_000).toISOString();

  const [
    usersRes,
    activeRes,
    todaySignupsRes,
    totalPostsRes,
    todayPostsRes,
    pendingRes,
    postTypesRes,
    topPostsRes,
    reportedUsersRes,
    reportedPostsRes,
    reportReasonsRes,
    regionsRes,
    reportStatsRes,
    signupTrendRes,
    releasedTxCountRes,
    releasedTxAmountRes,
  ] = await Promise.all([
    admin
      .from("users")
      .select("*", { count: "exact", head: true })
      .is("deleted_at", null),
    admin.rpc("get_active_users_count", { days: 7 }),
    admin
      .from("users")
      .select("*", { count: "exact", head: true })
      .gte("created_at", todayISO)
      .is("deleted_at", null),
    admin
      .from("posts")
      .select("*", { count: "exact", head: true })
      .eq("status", "active"),
    admin
      .from("posts")
      .select("post_type")
      .eq("status", "active")
      .gte("created_at", todayISO),
    admin
      .from(REPORTS_TABLE)
      .select("target_type, created_at")
      .eq("status", REPORT_STATUS.PENDING)
      .order("created_at", { ascending: true }),
    admin.from("posts").select("post_type").eq("status", "active"),
    admin
      .from("posts")
      .select("id, title, post_type, view_count")
      .eq("status", "active")
      .order("view_count", { ascending: false })
      .limit(5),
    admin.rpc("get_reported_users", { limit_count: 10 }),
    admin.rpc("get_reported_posts", { limit_count: 10 }),
    admin.from(REPORTS_TABLE).select("category").eq("status", REPORT_STATUS.PENDING),
    admin.rpc("get_region_post_counts", { days: 7 }),
    admin
      .from(REPORTS_TABLE)
      .select("status, created_at, resolved_at")
      .gte("created_at", thirtyDaysAgo),
    admin.rpc("get_daily_signups", { days: 30 }),
    admin
      .from("transactions")
      .select("*", { count: "exact", head: true })
      .eq("status", "released"),
    admin
      .from("transactions")
      .select("amount")
      .eq("status", "released"),
  ]);

  
  const totalUsers = usersRes.count ?? 0;
  const activeUsers = Number(activeRes.data?.[0]?.count ?? 0);
  const todaySignups = todaySignupsRes.count ?? 0;
  const totalPosts = totalPostsRes.count ?? 0;
  const totalReleasedTx = releasedTxCountRes.count ?? 0;
  const totalReleasedAmount = (releasedTxAmountRes.data ?? []).reduce(
    (sum, row) => sum + (row.amount ?? 0),
    0,
  );

  
  let todayPosts = 0;
  let todayByCat: { name: Category; delta: number }[] = [];
  if (todayPostsRes.data) {
    const counts: Record<string, number> = {};
    for (const row of todayPostsRes.data) {
      const label = POST_TYPE_LABEL[row.post_type] ?? "기타";
      counts[label] = (counts[label] ?? 0) + 1;
    }
    todayPosts = todayPostsRes.data.length;
    todayByCat = CAT_ORDER.filter((c) => counts[c]).map((name) => ({
      name,
      delta: counts[name] ?? 0,
    }));
  }

  
  let pendingTotal = 0,
    pendingUser = 0,
    pendingPost = 0;
  let oldestDays: number | null = null;
  if (pendingRes.data) {
    const rows = pendingRes.data;
    pendingTotal = rows.length;
    pendingUser = rows.filter((r) => r.target_type === "user").length;
    pendingPost = rows.filter((r) => r.target_type === "post").length;
    if (rows.length > 0) oldestDays = daysSince(rows[0].created_at!);
  }

  
  let donutData: { name: Category; value: number; pct: string }[] = [];
  if (postTypesRes.data) {
    const counts: Record<string, number> = {};
    for (const row of postTypesRes.data) {
      const label = POST_TYPE_LABEL[row.post_type] ?? "기타";
      counts[label] = (counts[label] ?? 0) + 1;
    }
    const total = postTypesRes.data.length || 1;
    donutData = CAT_ORDER.map((name) => ({
      name,
      value: counts[name] ?? 0,
      pct: `${Math.round(((counts[name] ?? 0) / total) * 100)}%`,
    }));
  }

  
  const topPosts = (topPostsRes.data ?? []).map(
    (
      p: { id: number; title: string; post_type: string; view_count: number },
      i: number,
    ) => ({
      rank: i + 1,
      id: p.id,
      post_type: p.post_type,
      title: p.title,
      cat: (POST_TYPE_LABEL[p.post_type] ?? "Kanto Go!") as Category,
      views: Number(p.view_count).toLocaleString(),
    }),
  );

  
  let reportTypes: {
    name: string;
    count: number;
    pct: string;
    w: string;
    color: string;
  }[] = [];
  if (reportReasonsRes.data) {
    const counts: Record<string, number> = {};
    for (const row of reportReasonsRes.data) {
      const key = normalizeReason(row.category);
      counts[key] = (counts[key] ?? 0) + 1;
    }
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const maxCount = sorted[0]?.[1] || 1;
    const total = sorted.reduce((s, [, c]) => s + c, 0) || 1;
    reportTypes = sorted.map(([name, count]) => ({
      name,
      count,
      pct: `${Math.round((count / total) * 100)}%`,
      w: `${Math.round((count / maxCount) * 100)}%`,
      color: REPORT_COLORS[name] ?? "#64748b",
    }));
  }

  
  const regions = (regionsRes.data ?? []).map(
    (r: { location: string; count: number }) => ({
      name: r.location,
      count: Number(r.count),
    }),
  );

  
  let reportStats = {
    weekResolved: 0,
    resolveRate: 0,
    avgHours: null as number | null,
  };
  if (reportStatsRes.data) {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const rows = reportStatsRes.data;
    const resolved = rows.filter((r) => r.status !== REPORT_STATUS.PENDING);
    const weekResolved = resolved.filter(
      (r) => r.resolved_at && new Date(r.resolved_at) >= weekStart,
    ).length;
    const resolveRate = rows.length
      ? Math.round((resolved.length / rows.length) * 100)
      : 0;
    const hours = resolved
      .filter(
        (r): r is typeof r & { resolved_at: string } => r.resolved_at !== null,
      )
      .map(
        (r) =>
          (new Date(r.resolved_at).getTime() -
            new Date(r.created_at).getTime()) /
          3_600_000,
      );
    const avgHours = hours.length
      ? Math.round((hours.reduce((a, b) => a + b, 0) / hours.length) * 10) / 10
      : null;
    reportStats = { weekResolved, resolveRate, avgHours };
  }

  
  const rawTrend = (signupTrendRes.data ?? []) as {
    day: string;
    count: number;
  }[];
  const filledTrend = fillDailyGaps(rawTrend, 30);
  const signupValues = filledTrend.map((d) => d.count);
  const sumSignups = signupValues.reduce((a, b) => a + b, 0).toLocaleString();
  const n = filledTrend.length;
  const xLabels =
    n > 0
      ? [0, 0.25, 0.5, 0.75, 1].map((f) => {
          const d = new Date(filledTrend[Math.round(f * (n - 1))].day);
          return `${d.getMonth() + 1}/${d.getDate()}`;
        })
      : [];

  return (
    <DashboardReportCenter
      reportedUsers={(reportedUsersRes.data ?? []) as ReportedUser[]}
      reportedPosts={(reportedPostsRes.data ?? []) as ReportedPost[]}
    >
      <HeaderSection />
      <UrgentReportBanner
        pendingTotal={pendingTotal}
        pendingUser={pendingUser}
        pendingPost={pendingPost}
        oldestDays={oldestDays}
      />
      <KpiCards
        totalUsers={totalUsers}
        activeUsers={activeUsers}
        todaySignups={todaySignups}
        totalPosts={totalPosts}
        todayPosts={todayPosts}
        totalReleasedTx={totalReleasedTx}
        totalReleasedAmount={totalReleasedAmount}
      />
      <TrendAndDonut
        signupValues={signupValues}
        sumSignups={sumSignups}
        xLabels={xLabels}
        donutData={donutData}
        todayByCat={todayByCat}
        todayPosts={todayPosts}
        totalPosts={totalPosts}
      />
      <RegionAndTopPosts regions={regions} topPosts={topPosts} />
      <div className="flex flex-wrap gap-5">
        <ReportQueue
          pendingTotal={pendingTotal}
          reportedUsers={(reportedUsersRes.data ?? []) as ReportedUser[]}
          reportedPosts={(reportedPostsRes.data ?? []) as ReportedPost[]}
        />
        <ReportTypes reportTypes={reportTypes} reportStats={reportStats} />
      </div>
    </DashboardReportCenter>
  );
}
