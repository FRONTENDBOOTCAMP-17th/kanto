import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { User } from "@supabase/supabase-js";

export async function middleware(request: NextRequest) {
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

  // 세션 갱신 — getUser()가 반드시 호출되어야 쿠키가 갱신됨
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const redirectResponse = redirectIfAuthenticated(user, request);
  if (redirectResponse) return redirectResponse;

  if (user) {
    const { data: userRow } = await supabase
      .from("users")
      .select("suspended_until")
      .eq("auth_id", user.id)
      .single();

    const suspendedUntil = userRow?.suspended_until;
    if (suspendedUntil && new Date(suspendedUntil) > new Date()) {
      const { pathname } = request.nextUrl;
      const BLOCKED_PATHS = ["/create", "/job/create", "/usedgoods/create", "/rental/create"];
      if (BLOCKED_PATHS.some((p) => pathname.startsWith(p))) {
        return NextResponse.redirect(new URL("/?suspended=1", request.url));
      }
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

const PROTECTED_PATHS = ["/job/create", "/usedgoods/create", "/create", "/myposts", "/favorites"];

async function redirectIfAuthenticated(
  user: User | null,
  request: NextRequest,
) {
  const { pathname } = request.nextUrl;

  if (!user && (
    PROTECTED_PATHS.includes(pathname) ||
    pathname.endsWith("/edit")
  )) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (user && ["/login", "/signup"].includes(pathname)) {
    return NextResponse.redirect(new URL("/main", request.url));
  }
}
