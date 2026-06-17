import { createClient } from "@/utils/supabase/server";

interface UserLikeReportStatus {
  userId: number | undefined;
  initialLiked: boolean;
  initialReported: boolean;
}

export async function getUserLikeReportStatus(
  postId: number,
): Promise<UserLikeReportStatus> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { userId: undefined, initialLiked: false, initialReported: false };

  const { data: userData } = await supabase
    .from("users")
    .select("id")
    .eq("auth_id", user.id)
    .single();

  if (!userData) return { userId: undefined, initialLiked: false, initialReported: false };

  const [{ data: likeData }, { data: reportData }] = await Promise.all([
    supabase
      .from("common_likes")
      .select("id")
      .eq("target_id", postId)
      .eq("target_type", "post")
      .eq("user_id", userData.id)
      .single(),
    supabase
      .from("common_reports")
      .select("id")
      .eq("target_id", postId)
      .eq("target_type", "post")
      .eq("user_id", userData.id)
      .single(),
  ]);

  return {
    userId: userData.id,
    initialLiked: !!likeData,
    initialReported: !!reportData,
  };
}
