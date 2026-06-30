import { createClient } from "@/utils/supabase/server";
import { REPORTS_TABLE } from "@/constants/report";
import { getCurrentUserId } from "@/services/user/user";

interface UserLikeReportStatus {
  userId: number | undefined;
  initialLiked: boolean;
  initialReported: boolean;
}

export async function getUserLikeReportStatus(
  postId: number,
): Promise<UserLikeReportStatus> {
  const userId = await getCurrentUserId();

  if (!userId) return { userId: undefined, initialLiked: false, initialReported: false };

  const supabase = await createClient();
  const [{ data: likeData }, { data: reportData }] = await Promise.all([
    supabase
      .from("common_likes")
      .select("id")
      .eq("target_id", postId)
      .eq("target_type", "post")
      .eq("user_id", userId)
      .single(),
    supabase
      .from(REPORTS_TABLE)
      .select("id")
      .eq("target_id", postId)
      .eq("target_type", "post")
      .eq("user_id", userId)
      .single(),
  ]);

  return {
    userId,
    initialLiked: !!likeData,
    initialReported: !!reportData,
  };
}
