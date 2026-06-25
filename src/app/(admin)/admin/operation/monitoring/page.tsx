import {
  BarChart2,
  ChevronLeft,
  Users,
  TrendingUp,
  AlertTriangle,
  ExternalLink,
  Activity,
  Wifi,
  XCircle,
  AlertCircle,
  Info,
  FileText,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";
import { getMonitoringStats, getSentryIssues } from "@/services/admin/adminMonitoring";
import { MonitoringTrendChart } from "./_components/MonitoringTrendChart";

const LEVEL_CONFIG = {
  error: { icon: XCircle, badge: "bg-red-50 text-red-600 border-red-100", label: "오류" },
  warning: { icon: AlertCircle, badge: "bg-amber-50 text-amber-600 border-amber-100", label: "경고" },
  info: { icon: Info, badge: "bg-blue-50 text-blue-600 border-blue-100", label: "정보" },
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "방금 전";
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  return `${Math.floor(hours / 24)}일 전`;
}

const CAT_COLORS: Record<string, string> = {
  "중고거래": "#ea580c",
  "커뮤니티": "#7c3aed",
  "구인구직": "#2563eb",
  "방 렌탈": "#16a34a",
};

export default async function MonitoringPage() {
  const [stats, sentry] = await Promise.all([getMonitoringStats(), getSentryIssues()]);

  const dauVsPrev =
    stats.dailySignups.length >= 2
      ? stats.dailySignups[stats.dailySignups.length - 1].count -
        stats.dailySignups[stats.dailySignups.length - 2].count
      : 0;

  const thisMonth = stats.monthlySignups[stats.monthlySignups.length - 1]?.count ?? 0;
  const lastMonth = stats.monthlySignups[stats.monthlySignups.length - 2]?.count ?? 0;
  const mauVsPrev = thisMonth - lastMonth;

  const maxPostType = Math.max(...stats.postTypes.map((p) => p.count), 1);
  const maxRegion = Math.max(...stats.regions.map((r) => r.count), 1);

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

      {/* 신규 가입자 추이 차트 */}
      <MonitoringTrendChart
        dailySignups={stats.dailySignups}
        monthlySignups={stats.monthlySignups}
        yearlySignups={stats.yearlySignups}
      />

      {/* 게시물 유형 분포 + 지역 분포 */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        {/* 게시물 유형 */}
        <div className="rounded-2xl border border-[#ebeef0] bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
          <h2 className="mb-4 text-[16px] font-bold text-slate-900">게시물 유형 분포</h2>
          {stats.postTypes.length === 0 ? (
            <p className="text-[13px] text-slate-400">데이터 없음</p>
          ) : (
            <div className="space-y-4">
              {stats.postTypes.map((item) => (
                <div key={item.name}>
                  <div className="mb-1.5 flex items-center justify-between text-[13px]">
                    <span className="font-medium text-slate-700">{item.name}</span>
                    <span className="font-bold text-slate-900">
                      {item.count.toLocaleString()}건 · {item.pct}
                    </span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${(item.count / maxPostType) * 100}%`,
                        backgroundColor: CAT_COLORS[item.name] ?? "#64748b",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 지역별 게시물 */}
        <div className="rounded-2xl border border-[#ebeef0] bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-[16px] font-bold text-slate-900">지역별 게시물</h2>
            <span className="text-[12px] text-slate-400">최근 30일</span>
          </div>
          {stats.regions.length === 0 ? (
            <p className="text-[13px] text-slate-400">데이터 없음</p>
          ) : (
            <div className="space-y-3">
              {stats.regions.map((r) => (
                <div key={r.name}>
                  <div className="mb-1 flex items-center justify-between text-[13px]">
                    <span className="font-medium text-slate-700">{r.name}</span>
                    <span className="font-bold text-slate-900">{r.count.toLocaleString()}건</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-teal-400 transition-all duration-700"
                      style={{ width: `${(r.count / maxRegion) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 오류 로그 */}
      <div className="rounded-2xl border border-[#ebeef0] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
        <div className="flex items-center justify-between border-b border-[#ebeef0] px-6 py-4">
          <div>
            <h2 className="text-[16px] font-bold text-slate-900">오류 로그</h2>
            <p className="mt-0.5 text-[12.5px] text-slate-400">
              {sentry.configured ? "Sentry 연동 · 미해결 이슈 최근 10건" : "Sentry 미연동 · 환경변수 설정 필요"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!sentry.configured && (
              <span className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-[12px] font-medium text-amber-600">
                설정 필요
              </span>
            )}
            <a
              href="https://sentry.io"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-[12.5px] font-semibold text-white hover:bg-slate-700"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Sentry 대시보드
            </a>
          </div>
        </div>

        {!sentry.configured ? (
          <div className="px-6 py-10 text-center">
            <p className="text-[13.5px] font-semibold text-slate-700">Sentry 연동이 필요합니다</p>
            <p className="mt-1.5 text-[12.5px] text-slate-400">
              .env.local에 NEXT_PUBLIC_SENTRY_DSN, SENTRY_AUTH_TOKEN, SENTRY_ORG, SENTRY_PROJECT를 설정하세요.
            </p>
          </div>
        ) : sentry.issues.length === 0 ? (
          <div className="px-6 py-10 text-center text-[13px] text-slate-400">미해결 이슈가 없습니다.</div>
        ) : (
          <div className="divide-y divide-[#ebeef0]">
            {sentry.issues.map((err) => {
              const level = (err.level in LEVEL_CONFIG ? err.level : "info") as keyof typeof LEVEL_CONFIG;
              const cfg = LEVEL_CONFIG[level];
              const Icon = cfg.icon;
              const iconColor =
                level === "error" ? "text-red-500" : level === "warning" ? "text-amber-400" : "text-blue-400";
              return (
                <a
                  key={err.id}
                  href={err.permalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-4 px-6 py-4 transition-colors hover:bg-slate-50"
                >
                  <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${iconColor}`} strokeWidth={2} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-[13.5px] font-semibold text-slate-800">{err.title}</span>
                      {err.isNew && (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-bold text-red-500">
                          NEW
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-[12px] text-slate-400">{err.culprit}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${cfg.badge}`}>
                      {cfg.label}
                    </span>
                    <div className="mt-1.5 text-[12px] text-slate-400">
                      <span className="font-semibold text-slate-700">{Number(err.count).toLocaleString()}회</span>
                      &nbsp;·&nbsp;{relativeTime(err.lastSeen)}
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        )}

        <div className="border-t border-[#ebeef0] px-6 py-3 text-center">
          <a
            href="https://sentry.io"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-400 hover:text-teal-500"
          >
            Sentry에서 전체 로그 보기
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
