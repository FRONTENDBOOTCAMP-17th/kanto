import { NextResponse } from "next/server";
import { hasLocale } from "next-intl";
import { routing } from "@/i18n/routing";
import { getUpcomingPublicNotices } from "@/services/admin/adminNotices";

// 헤더 공지 배너용 공개 API. 로케일별로 5분 ISR 캐시하고, 관리자가 공지를 수정하면
// revalidatePublicNotices()로 즉시 갱신한다. (기존: 루트 레이아웃에서 매 요청 DB 조회)
export const revalidate = 300;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ locale: string }> },
) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    return NextResponse.json([], { status: 404 });
  }
  return NextResponse.json(await getUpcomingPublicNotices(locale));
}
