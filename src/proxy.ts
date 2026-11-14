import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { isBlockedCrawler } from "@/constants/crawlers";
import { routing } from "@/i18n/routing";
import { encryptPostId, resolvePostId } from "@/utils/postIdCipher";

const PROTECTED_PATHS = ["/job/create", "/usedgoods/create", "/create", "/myposts", "/favorites"];
const BLOCKED_PATHS = ["/create", "/job/create", "/usedgoods/create", "/rental/create"];

// 로케일 접두사(/en, /fil)를 판별·부여하고, 접두사 없는 경로는 기본 로케일(ko)로 rewrite한다.
const handleI18nRouting = createIntlMiddleware(routing);

type CookieToSet = { name: string; value: string; options?: Parameters<NextResponse["cookies"]["set"]>[2] };

// "/en/myposts" -> { prefix: "/en", path: "/myposts" }, "/myposts" -> { prefix: "", path: "/myposts" }
function splitLocalePrefix(pathname: string) {
  const [, first] = pathname.split("/");
  if ((routing.locales as readonly string[]).includes(first)) {
    return { prefix: `/${first}`, path: pathname.slice(first.length + 1) || "/" };
  }
  return { prefix: "", path: pathname };
}

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

  const { prefix, path } = splitLocalePrefix(request.nextUrl.pathname);

  // 예전 랜덤 토큰·숫자 id로 들어온 상세 URL은 정식 토큰 URL로 보낸다.
  // 그대로 렌더링하면 URL마다 ISR 캐시가 따로 쓰인다.
  const canonicalPath = canonicalizePostPath(path);
  if (canonicalPath) {
    const url = request.nextUrl.clone();
    url.pathname = `${prefix}${canonicalPath}`;
    return NextResponse.redirect(url, 308);
  }

  // API·OAuth 콜백은 로케일 라우팅 대상이 아니다 (src/app/api, src/app/auth)
  const isRouteHandler = path.startsWith("/api/") || path.startsWith("/auth/");

  let authId: string | null = null;
  const cookiesToSet: CookieToSet[] = [];

  // 로그인 쿠키가 없으면 갱신할 세션도 없으므로 Supabase 호출을 건너뛴다 (비로그인·크롤러 트래픽).
  if (hasSupabaseAuthCookie(request)) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookies) {
            // 요청 쿠키를 갱신해 두면 이후 next-intl 미들웨어가 요청 헤더를 그대로 넘겨
            // 같은 요청의 서버 컴포넌트도 갱신된 세션을 읽는다.
            cookies.forEach(({ name, value }) => request.cookies.set(name, value));
            cookiesToSet.push(...cookies);
          },
        },
      },
    );

    // getClaims는 비대칭 JWT 서명 키 사용 시 JWKS(캐시)로 로컬 검증해 Auth 서버 왕복이 없다.
    // 액세스 토큰이 만료 직전이면 먼저 세션을 갱신하고 setAll로 쿠키를 내려준다.
    const { data } = await supabase.auth.getClaims();
    authId = data?.claims?.sub ?? null;

    // 정지 여부는 작성 경로에서만 필요하므로 그 외 요청에서는 users 조회를 하지 않는다.
    if (authId && BLOCKED_PATHS.some((p) => path.startsWith(p))) {
      const { data: userRow } = await supabase
        .from("users")
        .select("suspended_until")
        .eq("auth_id", authId)
        .single();

      const suspendedUntil = userRow?.suspended_until;
      if (suspendedUntil && new Date(suspendedUntil) > new Date()) {
        return withCookies(
          NextResponse.redirect(new URL(`${prefix}/main`, request.url)),
          cookiesToSet,
        );
      }
    }
  }

  if (!isRouteHandler) {
    const redirectTo = redirectByAuth(authId, path);
    if (redirectTo) {
      return withCookies(
        NextResponse.redirect(new URL(`${prefix}${redirectTo}`, request.url)),
        cookiesToSet,
      );
    }
  }

  const response = isRouteHandler
    ? NextResponse.next({ request })
    : handleI18nRouting(request);
  return withCookies(response, cookiesToSet);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|_vercel|favicon.ico|sitemap.xml|robots.txt|manifest.webmanifest|api/posts/cleanup|api/payment/xendit/webhook|.*opengraph-image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|txt|xml|js|css|map|woff2?|json|webmanifest)$).*)",
  ],
};

// "/job/<토큰>/edit" -> 정식 토큰이 아니면 "/job/<정식 토큰>/edit", 이미 정식이거나 해당 없으면 null
function canonicalizePostPath(path: string) {
  const match = path.match(/^\/(job|usedgoods|rental)\/([^/]+)(\/.*)?$/);
  if (!match) return null;
  const [, section, idOrToken, rest = ""] = match;
  if (idOrToken === "create") return null;

  const postId = resolvePostId(idOrToken);
  if (postId === null) return null;

  const token = encryptPostId(postId);
  return token === idOrToken ? null : `/${section}/${token}${rest}`;
}

function redirectByAuth(authId: string | null, path: string) {
  if (!authId && (PROTECTED_PATHS.includes(path) || path.endsWith("/edit"))) {
    return "/login";
  }
  if (authId && ["/login", "/signup"].includes(path)) {
    return "/main";
  }
  return null;
}

// 갱신된 세션 쿠키를 최종 응답(리다이렉트·rewrite 포함)에 실어 보낸다.
function withCookies(response: NextResponse, cookies: CookieToSet[]) {
  cookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
  return response;
}
