import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/type/supabase";

// Service Role 키를 사용하는 서버 전용 클라이언트.
// RLS를 완전히 우회하므로 반드시 서버 컴포넌트 / API Route에서만 사용할 것.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;

  if (!url || !key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL 또는 SUPABASE_SECRET_KEY 환경 변수가 설정되지 않았습니다.",
    );
  }

  return createClient<Database>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
