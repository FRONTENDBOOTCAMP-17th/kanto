import Link from "next/link";
import {
  Bell,
  ShieldCheck,
  BarChart2,
  KeyRound,
  ScrollText,
  TrendingUp,
} from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const sections = [
  {
    icon: Bell,
    label: "공지 & 점검",
    description: "전체 공지 등록·관리 및 서비스 점검 일정을 설정합니다.",
    href: "/admin/operation/notices",
  },
  {
    icon: ShieldCheck,
    label: "콘텐츠 관리",
    description: "금칙어 필터 룰과 스팸 감지 설정을 관리합니다.",
    href: "/admin/operation/content",
  },
  {
    icon: BarChart2,
    label: "통계 & 모니터링",
    description: "DAU/MAU 추이, 실시간 접속자 수, 오류 로그를 확인합니다.",
    href: "/admin/operation/monitoring",
  },
  {
    icon: TrendingUp,
    label: "인기 관리",
    description: "구인구직 게시글의 인기 순위(1~5위)를 직접 지정합니다. (슈퍼어드민 전용)",
    href: "/admin/operation/popular-jobs",
    allowedUserId: 181,
  },
  {
    icon: KeyRound,
    label: "권한 관리",
    description: "어드민 계정과 기능별 접근 권한을 관리합니다. (슈퍼어드민 전용)",
    href: "/admin/operation/permissions",
  },
  {
    icon: ScrollText,
    label: "감사 로그",
    description: "어드민 활동 이력을 조회합니다. (슈퍼어드민 전용)",
    href: "/admin/operation/audit-logs",
  },
];

export default async function OperationPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let currentUserId: number | null = null;
  if (user) {
    const { data } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("auth_id", user.id)
      .single();
    currentUserId = data?.id ?? null;
  }

  const visibleSections = sections.filter(
    (s) => !("allowedUserId" in s) || s.allowedUserId === currentUserId,
  );

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">운영 관리</h1>
        <p className="mt-1 text-sm text-slate-500">
          서비스 운영에 필요한 기능을 관리합니다.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {visibleSections.map(({ icon: Icon, label, description, href }) => (
          <Link
            key={label}
            href={href}
            className="relative flex min-h-40 overflow-hidden rounded-2xl border border-[#ebeef0] bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition-all hover:bg-teal-50 hover:shadow-[0_4px_20px_rgba(0,0,0,0.10)]"
          >
            <Icon
              className="absolute right-4 top-1/2 -translate-y-1/2 h-30 w-30 text-slate-200"
              strokeWidth={1.5}
            />
            <div className="relative flex flex-col justify-center gap-2 pr-32">
              <span className="text-[19px] font-semibold text-slate-800">
                {label}
              </span>
              <p className="text-[13px] leading-relaxed text-slate-500">
                {description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
