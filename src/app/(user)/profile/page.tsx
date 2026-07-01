import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { ProfileCard } from "@/app/(user)/profile/_components/ProfileCard";
import { getReviewsForUser } from "@/services/review/review";
import type { AlertSettings } from "@/hooks/profile/useAlertSettings";
import type { MeetupSummary } from "@/app/(user)/profile/_components/sections/ProfileMeetingsSection";

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

  type MeetupRow = {
    post_id: number;
    topic: string;
    start_at: string;
    end_at: string;
    location_address: string;
    max_participants: number;
    posts: { title: string; status: string; user_id: number; users?: { name: string | null } | null };
    meetup_participants?: { status: string }[];
  };

  type JoinedRow = {
    meetup_post_id: number;
    meetups: MeetupRow & { posts: MeetupRow["posts"] & { users?: { name: string | null } | null } };
  };

  const [postCount, likeCount] = userId
    ? await Promise.all([
        supabase
          .from("posts")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("status", "active")
          .in("post_type", ["used_goods", "jobs", "rental"])
          .then(({ count }) => count ?? 0),
        supabase
          .from("common_likes")
          .select("target_id, posts!inner(id)", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("target_type", "post")
          .eq("posts.status", "active")
          .in("posts.post_type", ["used_goods", "jobs", "rental"])
          .then(({ count }) => count ?? 0),
      ])
    : [0, 0];

  const [createdMeetups, joinedMeetups] = userId
    ? await Promise.all([
        supabase
          .from("meetups")
          .select(`post_id, topic, start_at, end_at, location_address, max_participants,
            posts!inner(title, status, user_id),
            meetup_participants(status)`)
          .eq("posts.user_id", userId)
          .order("start_at", { ascending: false })
          .then(({ data }) =>
            ((data ?? []) as unknown as MeetupRow[]).map((r): MeetupSummary => ({
              post_id: r.post_id,
              title: r.posts.title,
              topic: r.topic,
              start_at: r.start_at,
              end_at: r.end_at,
              location_address: r.location_address,
              max_participants: r.max_participants,
              post_status: r.posts.status,
              participant_count: (r.meetup_participants ?? []).filter((p) => p.status === "joined").length,
            })),
          ),
        supabase
          .from("meetup_participants")
          .select(`meetup_post_id,
            meetups!inner(post_id, topic, start_at, end_at, location_address, max_participants,
              posts!inner(title, status, user_id, users!posts_user_id_fkey(name)),
              meetup_participants(status))`)
          .eq("user_id", userId)
          .eq("status", "joined")
          .then(({ data }) =>
            ((data ?? []) as unknown as JoinedRow[])
              .filter((r) => r.meetups.posts.user_id !== userId)
              .sort((a, b) => new Date(b.meetups.start_at).getTime() - new Date(a.meetups.start_at).getTime())
              .map((r): MeetupSummary => ({
                post_id: r.meetups.post_id,
                title: r.meetups.posts.title,
                topic: r.meetups.topic,
                start_at: r.meetups.start_at,
                end_at: r.meetups.end_at,
                location_address: r.meetups.location_address,
                max_participants: r.meetups.max_participants,
                post_status: r.meetups.posts.status,
                participant_count: (r.meetups.meetup_participants ?? []).filter((p) => p.status === "joined").length,
                host_name: r.meetups.posts.users?.name ?? undefined,
              })),
          ),
      ])
    : [[] as MeetupSummary[], [] as MeetupSummary[]];

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
          createdMeetups={createdMeetups}
          joinedMeetups={joinedMeetups}
        />
      </div>
    </div>
  );
}
