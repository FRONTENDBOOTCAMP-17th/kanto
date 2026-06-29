import { ExternalLink, XCircle, AlertCircle, Info } from "lucide-react";
import type { SentryResult } from "@/services/admin/adminMonitoring";

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

interface Props {
  sentry: SentryResult;
}

export function ErrorsTab({ sentry }: Props) {
  return (
    <div className="rounded-2xl border border-[#ebeef0] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
      <div className="flex items-center justify-between border-b border-[#ebeef0] px-6 py-4">
        <div>
          <h2 className="text-[16px] font-bold text-slate-900">오류 로그</h2>
          <p className="mt-0.5 text-[12.5px] text-slate-400">
            {sentry.configured
              ? `Sentry 연동 · 미해결 이슈 최근 ${sentry.issues.length}건`
              : "Sentry 미연동 · 환경변수 설정 필요"}
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
            const iconColor = level === "error" ? "text-red-500" : level === "warning" ? "text-amber-400" : "text-blue-400";
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
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-bold text-red-500">NEW</span>
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
  );
}
