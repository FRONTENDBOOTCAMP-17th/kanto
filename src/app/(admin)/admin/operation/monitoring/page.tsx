import {
  BarChart2,
  ChevronLeft,
  Users,
  TrendingUp,
  AlertTriangle,
  Activity,
  Wifi,
  FileText,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";
import { getMonitoringStats, getSentryIssues, getSentryPerformance } from "@/services/admin/adminMonitoring";
import { MonitoringTabContent } from "./_components/MonitoringTabContent";

export default async function MonitoringPage() {
  const [stats, sentry, performance] = await Promise.all([getMonitoringStats(), getSentryIssues(), getSentryPerformance()]);

  const dauVsPrev =
    stats.dailySignups.length >= 2
      ? stats.dailySignups[stats.dailySignups.length - 1].count -
        stats.dailySignups[stats.dailySignups.length - 2].count
      : 0;

  const thisMonth = stats.monthlySignups[stats.monthlySignups.length - 1]?.count ?? 0;
  const lastMonth = stats.monthlySignups[stats.monthlySignups.length - 2]?.count ?? 0;
  const mauVsPrev = thisMonth - lastMonth;

  return (
    <div className="p-6 lg:p-8">
      {/* Page header */}
      <div className="mb-7">
        <Link
          href="/admin/operation"
          className="mb-2 flex items-center gap-1 text-[13px] text-slate-400 hover:text-slate-600"
        >
          <ChevronLeft className="h-3.5 w-3.5" strokeWidth={2.5} />
          운영 관리
        </Link>
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50">
            <BarChart2 className="h-5 w-5 text-teal-600" strokeWidth={2} />
          </div>
          <h1 className="text-[24px] font-bold text-slate-900">통계 & 모니터링</h1>
        </div>
        <p className="mt-1 text-[13px] text-slate-500">
          가입자 추이, 게시물 현황, 신고 통계를 확인합니다.
        </p>
      </div>

      {/* KPI 카드 */}
      <div className="mb-6 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
        {/* 전체 회원 */}
        <div className="rounded-2xl border border-[#edf0f2] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[13px] font-semibold text-slate-500">전체 회원</span>
            <Users className="h-4 w-4 text-teal-400" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-[27px] font-extrabold tracking-tight text-slate-900">
              {stats.totalUsers.toLocaleString()}
            </span>
            <span className="ml-0.5 text-[14px] font-semibold text-slate-400">명</span>
          </div>
          <div className="mt-2 text-[12px] text-teal-500">
            오늘 +{stats.newToday.toLocaleString()}명 가입
          </div>
        </div>

        {/* DAU */}
        <div className="rounded-2xl border border-[#edf0f2] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[13px] font-semibold text-slate-500">DAU (오늘 활성)</span>
            <Activity className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-[27px] font-extrabold tracking-tight text-slate-900">
              {stats.dau.toLocaleString()}
            </span>
            <span className="ml-0.5 text-[14px] font-semibold text-slate-400">명</span>
          </div>
          <div
            className={[
              "mt-2 flex items-center gap-1 text-[12px]",
              dauVsPrev >= 0 ? "text-teal-500" : "text-rose-400",
            ].join(" ")}
          >
            <TrendingUp className="h-3.5 w-3.5" />
            <span>전일 대비 {dauVsPrev >= 0 ? "+" : ""}{dauVsPrev}명</span>
          </div>
        </div>

        {/* MAU */}
        <div className="rounded-2xl border border-[#edf0f2] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[13px] font-semibold text-slate-500">MAU (이번달 활성)</span>
            <Wifi className="h-4 w-4 text-blue-400" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-[27px] font-extrabold tracking-tight text-slate-900">
              {stats.mau.toLocaleString()}
            </span>
            <span className="ml-0.5 text-[14px] font-semibold text-slate-400">명</span>
          </div>
          <div
            className={[
              "mt-2 flex items-center gap-1 text-[12px]",
              mauVsPrev >= 0 ? "text-teal-500" : "text-rose-400",
            ].join(" ")}
          >
            <TrendingUp className="h-3.5 w-3.5" />
            <span>전월 대비 {mauVsPrev >= 0 ? "+" : ""}{mauVsPrev}명</span>
          </div>
        </div>

        {/* 게시물 */}
        <div className="rounded-2xl border border-[#edf0f2] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[13px] font-semibold text-slate-500">활성 게시물</span>
            <FileText className="h-4 w-4 text-violet-400" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-[27px] font-extrabold tracking-tight text-slate-900">
              {stats.totalPosts.toLocaleString()}
            </span>
            <span className="ml-0.5 text-[14px] font-semibold text-slate-400">건</span>
          </div>
          <div className="mt-2 text-[12px] text-teal-500">
            오늘 +{stats.newPostsToday.toLocaleString()}건 등록
          </div>
        </div>

        {/* 미해결 신고 */}
        <div className="rounded-2xl border border-[#edf0f2] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[13px] font-semibold text-slate-500">미해결 신고</span>
            <AlertTriangle className="h-4 w-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-1">
            <span
              className={[
                "text-[27px] font-extrabold tracking-tight",
                stats.pendingReports > 0 ? "text-red-500" : "text-slate-900",
              ].join(" ")}
            >
              {stats.pendingReports.toLocaleString()}
            </span>
            <span className="ml-0.5 text-[14px] font-semibold text-slate-400">건</span>
          </div>
          <Link
            href="/admin/reports"
            className="mt-2 block text-[12px] text-slate-400 hover:text-teal-500"
          >
            신고 센터 바로가기 →
          </Link>
        </div>

        {/* 누적 제재 */}
        <div className="rounded-2xl border border-[#edf0f2] bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[13px] font-semibold text-slate-500">누적 제재</span>
            <ShieldAlert className="h-4 w-4 text-rose-400" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-[27px] font-extrabold tracking-tight text-slate-900">
              {stats.totalSanctions.toLocaleString()}
            </span>
            <span className="ml-0.5 text-[14px] font-semibold text-slate-400">건</span>
          </div>
          <Link
            href="/admin/users"
            className="mt-2 block text-[12px] text-slate-400 hover:text-teal-500"
          >
            제재 내역 바로가기 →
          </Link>
        </div>
      </div>

      <MonitoringTabContent
        stats={stats}
        sentry={sentry}
        performance={performance}
      />
    </div>
  );
}
