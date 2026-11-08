import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/type/supabase";

export type PublicSupabaseClient = SupabaseClient<Database>;

// 쿠키·세션 없이 anon 권한으로 공개 데이터를 읽는 서버용 클라이언트.
// cookies()를 읽지 않으므로 이 클라이언트만 쓰는 페이지는 정적(ISR)으로 캐시될 수 있다.
// (로그인 사용자별 데이터는 클라이언트에서 따로 가져온다)
export function createPublicClient(): PublicSupabaseClient {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
