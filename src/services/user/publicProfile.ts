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
  identityVerified: boolean;
  neighborhoodVerified: boolean; // 스키마 미구현 - 항상 false
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
    if (data.auth_id) {
      const admin = createAdminClient();
      const { data: authData } = await admin.auth.admin.getUserById(
        data.auth_id,
      );
      identityVerified =
        authData?.user?.user_metadata?.identity_verified === true;
    }

    return {
      id: data.id,
      name: data.name ?? "",
      avatarUrl: data.avatar_url,
      createdAt: data.created_at,
      postCount: data.post_count ?? 0,
      avgRating: data.avg_rating,
      identityVerified,
      neighborhoodVerified: false,
    };
  },
);
