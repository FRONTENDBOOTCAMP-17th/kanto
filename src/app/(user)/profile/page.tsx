import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { ProfileCard } from "@/app/(user)/profile/_components/ProfileCard";
import { getReviewsForUser } from "@/services/review/review";
import type { AlertSettings } from "@/hooks/profile/useAlertSettings";

export const metadata: Metadata = {
  robots: { index: false },
};

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("users")
    .select("id, alert_chat, alert_comment, alert_post, interest_categories, alert_keywords")
    .eq("auth_id", user.id)
    .single();

  const alertSettings: AlertSettings = {
    alert_chat: data?.alert_chat ?? true,
    alert_comment: data?.alert_comment ?? true,
    alert_post: data?.alert_post ?? false,
    interest_categories: data?.interest_categories ?? null,
    alert_keywords: data?.alert_keywords ?? null,
  };

  const userId = data?.id ?? null;
  const reviews = userId ? await getReviewsForUser(userId) : [];
  const initialIsVerified = user.user_metadata?.identity_verified === true;

  const [postCount, likeCount] = userId
    ? await Promise.all([
        supabase
          .from("posts")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("status", "active")
          .then(({ count }) => count ?? 0),
        supabase
          .from("common_likes")
          .select("target_id, posts!inner(id)", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("target_type", "post")
          .eq("posts.status", "active")
          .then(({ count }) => count ?? 0),
      ])
    : [0, 0];

  return (
    <div className="bg-white md:bg-teal-50">
      <div className="max-w-lg md:max-w-5xl mx-auto py-8">
        <ProfileCard
          alertSettings={alertSettings}
          initialIdentities={user.identities ?? []}
          reviews={reviews}
          initialIsVerified={initialIsVerified}
          postCount={postCount ?? 0}
          likeCount={likeCount ?? 0}
        />
      </div>
    </div>
  );
}
