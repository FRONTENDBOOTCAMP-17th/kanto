import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isBlockedCrawler } from "@/constants/crawlers";

const PROTECTED_PATHS = ["/job/create", "/usedgoods/create", "/create", "/myposts", "/favorites"];
const BLOCKED_PATHS = ["/create", "/job/create", "/usedgoods/create", "/rental/create"];

// Supabase 세션 쿠키(sb-<project>-auth-token, 청크 분할 시 .0/.1 접미사)가 있는지
function hasSupabaseAuthCookie(request: NextRequest) {
  return request.cookies
    .getAll()
    .some(({ name }) => name.startsWith("sb-") && name.includes("-auth-token"));
}

export async function proxy(request: NextRequest) {
  // robots.txt를 무시하고 SSR 페이지를 긁어가는 AI 크롤러는 렌더링 전에 차단한다.
  if (isBlockedCrawler(request.headers.get("user-agent"))) {
    return new NextResponse(null, { status: 403 });
  }

  const { pathname } = request.nextUrl;

  // 로그인 쿠키가 없으면 갱신할 세션도 없으므로 Supabase 호출을 건너뛴다 (비로그인·크롤러 트래픽).
  if (!hasSupabaseAuthCookie(request)) {
    return redirectByAuth(null, request) ?? NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getClaims는 비대칭 JWT 서명 키 사용 시 JWKS(캐시)로 로컬 검증해 Auth 서버 왕복이 없다.
  // 액세스 토큰이 만료 직전이면 먼저 세션을 갱신하고 setAll로 쿠키를 내려준다.
  const { data } = await supabase.auth.getClaims();
  const authId = data?.claims?.sub ?? null;

  const redirectResponse = redirectByAuth(authId, request);
  if (redirectResponse) return withCookies(redirectResponse, supabaseResponse);

  // 정지 여부는 작성 경로에서만 필요하므로 그 외 요청에서는 users 조회를 하지 않는다.
  if (authId && BLOCKED_PATHS.some((p) => pathname.startsWith(p))) {
    const { data: userRow } = await supabase
      .from("users")
      .select("suspended_until")
      .eq("auth_id", authId)
      .single();

    const suspendedUntil = userRow?.suspended_until;
    if (suspendedUntil && new Date(suspendedUntil) > new Date()) {
      return withCookies(
        NextResponse.redirect(new URL("/main", request.url)),
        supabaseResponse,
      );
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|manifest.webmanifest|api/posts/cleanup|api/payment/xendit/webhook|.*opengraph-image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|txt|xml|js|css|map|woff2?|json|webmanifest)$).*)",
  ],
};

function redirectByAuth(authId: string | null, request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!authId && (
    PROTECTED_PATHS.includes(pathname) ||
    pathname.endsWith("/edit")
  )) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (authId && ["/login", "/signup"].includes(pathname)) {
    return NextResponse.redirect(new URL("/main", request.url));
  }

  return null;
}

// 리다이렉트 응답에도 갱신된 세션 쿠키를 실어 보낸다.
function withCookies(response: NextResponse, from: NextResponse) {
  from.cookies.getAll().forEach((cookie) => response.cookies.set(cookie));
  return response;
}
