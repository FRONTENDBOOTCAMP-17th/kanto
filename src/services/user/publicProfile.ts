import { cache } from "react";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

export interface PublicProfile {
  id: number;
  name: string;
  avatarUrl: string | null;
  createdAt: string | null;
  postCount: number;
  avgRating: number | null;
  ktsScore: number | null;
  ktsGrade: string | null;
  identityVerified: boolean;
}

// 다른 유저의 공개 프로필을 조회한다.
// 본인인증(identity_verified)은 auth user_metadata에만 있어 admin 클라이언트로 읽는다.
export const getPublicProfile = cache(
  async (userId: number): Promise<PublicProfile | null> => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("public_user_profiles")
      .select("id, auth_id, name, avatar_url, created_at, post_count, avg_rating")
      .eq("id", userId)
      .maybeSingle();

    if (!data || data.id === null) return null;

    let identityVerified = false;
    let ktsScore: number | null = null;
    let ktsGrade: string | null = null;
    const admin = createAdminClient();

    const [{ data: ktsData }, authResult] = await Promise.all([
      admin
        .from("users")
        .select("kts_score, kts_grade")
        .eq("id", data.id)
        .maybeSingle(),
      data.auth_id
        ? admin.auth.admin.getUserById(data.auth_id)
        : Promise.resolve({ data: null }),
    ]);

    ktsScore = ktsData?.kts_score ?? null;
    ktsGrade = ktsData?.kts_grade ?? null;

    if (authResult.data) {
      identityVerified =
        authResult.data.user?.user_metadata?.identity_verified === true;
    }

    return {
      id: data.id,
      name: data.name ?? "",
      avatarUrl: data.avatar_url,
      createdAt: data.created_at,
      postCount: data.post_count ?? 0,
      avgRating: data.avg_rating,
      ktsScore,
      ktsGrade,
      identityVerified,
    };
  },
);
