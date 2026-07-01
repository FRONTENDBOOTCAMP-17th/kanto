"use server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { getSessionUser, requireAdmin } from "@/services/user/user";
import { createRoomForMeetup, endRoom, postSystemMessageForMeetup } from "@/services/go/groupChat";
import { manilaWallTimeToISO } from "@/utils/goTime";
import type {
  Meetup,
  MeetupParticipant,
  CreateMeetupInput,
  AdminMeetup,
} from "@/type/go";

type MeetupParticipantStatusRow = { status: string };

type MeetupRow = {
  post_id: number;
  topic: Meetup["topic"];
  start_at: string;
  end_at: string;
  location_lat: number;
  location_lng: number;
  location_address: string;
  location_detail: string | null;
  description: string;
  max_participants: number;
  posts: {
    title: string;
    user_id: number;
    status: Meetup["status"];
    created_at?: string;
    users?: { name: string | null } | null;
  };
  meetup_participants?: MeetupParticipantStatusRow[] | null;
};

type MeetupDetailRow = Omit<MeetupRow, "meetup_participants">;

type MeetupParticipantRow = {
  id: number;
  meetup_post_id: number;
  user_id: number;
  joined_at: string;
  status: MeetupParticipant["status"];
  users?: {
    name: string | null;
    avatar_url: string | null;
    deleted_at?: string | null;
  } | null;
};

type MeetupTitleHostRow = {
  posts: {
    user_id: number;
    title: string;
  };
};

type AdminMeetupRow = Omit<MeetupRow, "meetup_participants"> & {
  posts: MeetupRow["posts"] & { created_at: string };
  meetup_participants?: Array<{
    id: number;
    user_id: number;
    status: string;
    users?: { name: string | null } | null;
  }> | null;
};

export async function getActiveMeetups(): Promise<Meetup[]> {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("meetups")
    .select(
      `
      *,
      posts!inner ( title, user_id, status, created_at, users:public_profiles!posts_user_id_fkey ( name ) ),
      meetup_participants ( status )
    `,
    )
    .gt("end_at", now)
    .eq("posts.status", "active")
    .order("start_at", { ascending: true });

  if (error) throw error;

  return ((data ?? []) as unknown as MeetupRow[]).map((row) => ({
    post_id: row.post_id,
    topic: row.topic,
    start_at: row.start_at,
    end_at: row.end_at,
    location_lat: row.location_lat,
    location_lng: row.location_lng,
    location_address: row.location_address,
    location_detail: row.location_detail,
    description: row.description,
    max_participants: row.max_participants,
    title: row.posts.title,
    host_id: row.posts.user_id,
    host_name: row.posts.users?.name ?? "알 수 없음",
    status: row.posts.status,
    participant_count: (row.meetup_participants ?? []).filter((p) => p.status === "joined").length,
  }));
}

export async function getMyJoinedMeetupIds(): Promise<number[]> {
  const supabase = await createClient();
  const sessionUser = await getSessionUser();
  if (!sessionUser) return [];

  const { data } = await supabase
    .from("meetup_participants")
    .select("meetup_post_id")
    .eq("user_id", sessionUser.id)
    .eq("status", "joined");

  return (data ?? []).map((p) => (p as { meetup_post_id: number }).meetup_post_id);
}

export async function getMeetupDetail(postId: number): Promise<{
  meetup: Meetup;
  participants: MeetupParticipant[];
}> {
  const supabase = await createClient();

  const [meetupRes, participantsRes] = await Promise.all([
    supabase
      .from("meetups")
      .select(`*, posts!inner(title, user_id, status, users:public_profiles!posts_user_id_fkey(name))`)
      .eq("post_id", postId)
      .single(),
    supabase
      .from("meetup_participants")
      .select(`*, users:public_profiles(name, avatar_url, deleted_at)`)
      .eq("meetup_post_id", postId)
      .eq("status", "joined"),
  ]);

  if (meetupRes.error) throw meetupRes.error;
  if (participantsRes.error) throw participantsRes.error;

  const row = meetupRes.data as unknown as MeetupDetailRow;
  return {
    meetup: {
      post_id: row.post_id,
      topic: row.topic,
      start_at: row.start_at,
      end_at: row.end_at,
      location_lat: row.location_lat,
      location_lng: row.location_lng,
      location_address: row.location_address,
      location_detail: row.location_detail,
      description: row.description,
      max_participants: row.max_participants,
      title: row.posts.title,
      host_id: row.posts.user_id,
      host_name: row.posts.users?.name ?? "알 수 없음",
      status: row.posts.status,
      participant_count: participantsRes.data?.length ?? 0,
    },
    participants: ((participantsRes.data ?? []) as unknown as MeetupParticipantRow[]).map((p) => ({
      id: p.id,
      meetup_post_id: p.meetup_post_id,
      user_id: p.user_id,
      joined_at: p.joined_at,
      status: p.status,
      display_name: p.users?.name ?? "알 수 없음",
      avatar_url: p.users?.avatar_url ?? null,
      is_deleted: !!p.users?.deleted_at,
    })),
  };
}

export async function createMeetup(input: CreateMeetupInput): Promise<number> {
  const supabase = await createClient();
  const sessionUser = await getSessionUser();
  if (!sessionUser) throw new Error("MUST_LOGIN");

  
  const startAt = manilaWallTimeToISO(input.date, input.startTime);
  const endAt = manilaWallTimeToISO(input.date, input.endTime);

  
  const { data: post, error: postError } = await supabase
    .from("posts")
    .insert({
      title: input.title,
      user_id: sessionUser.id,
      post_type: "meetup",
      status: "active",
    } as never)
    .select("id")
    .single();

  if (postError) throw postError;
  const postId = (post as { id: number }).id;

  
  const { error: meetupError } = await supabase.from("meetups").insert({
    post_id: postId,
    topic: input.topic,
    description: input.description,
    start_at: startAt,
    end_at: endAt,
    location_lat: input.lat,
    location_lng: input.lng,
    location_address: input.address,
    location_detail: input.locationDetail ?? null,
    max_participants: input.maxParticipants,
  } as never);

  if (meetupError) throw meetupError;

  await createRoomForMeetup(postId, endAt);

  return postId;
}

export async function getMyMeetupStatus(
  meetupPostId: number,
): Promise<"joined" | "cancelled" | "none"> {
  const supabase = await createClient();
  const sessionUser = await getSessionUser();
  if (!sessionUser) return "none";

  const { data } = await supabase
    .from("meetup_participants")
    .select("status")
    .eq("meetup_post_id", meetupPostId)
    .eq("user_id", sessionUser.id)
    .maybeSingle();

  return (data?.status as "joined" | "cancelled" | undefined) ?? "none";
}

export async function joinMeetup(meetupPostId: number): Promise<void> {
  const supabase = await createClient();
  const sessionUser = await getSessionUser();
  if (!sessionUser) throw new Error("MUST_LOGIN");

  
  const { data: existing, error: existingError } = await supabase
    .from("meetup_participants")
    .select("status")
    .eq("meetup_post_id", meetupPostId)
    .eq("user_id", sessionUser.id)
    .maybeSingle();

  if (existingError) throw new Error("JOIN_FAILED");
  if (existing?.status === "cancelled") throw new Error("REENTRY_FORBIDDEN");
  if (existing?.status === "joined") return; 

  const { error } = await supabase.from("meetup_participants").insert({
    meetup_post_id: meetupPostId,
    user_id: sessionUser.id,
    status: "joined",
  } as never);

  if (error) throw new Error("JOIN_FAILED");

  await postSystemMessageForMeetup(meetupPostId, `${sessionUser.name}님이 참여했습니다.`);

  
  const { data: meetupData } = await supabase
    .from("meetups")
    .select("posts!inner(user_id, title)")
    .eq("post_id", meetupPostId)
    .single();

  if (meetupData) {
    const { posts } = meetupData as unknown as MeetupTitleHostRow;
    const hostId = posts.user_id;
    const title = posts.title;
    if (hostId !== sessionUser.id) {
      try {
        const admin = createAdminClient();
        await admin.from("common_notifications").insert({
          receiver_id: hostId,
          title: "새 참여자",
          body: `"${title}" 모임에 새 참여자가 합류했습니다!`,
          type: "meetup",
          related_type: "meetup",
          related_id: meetupPostId,
        } as never);
      } catch {
        
      }
    }
  }
}

export async function cancelJoin(meetupPostId: number): Promise<void> {
  const supabase = await createClient();
  const sessionUser = await getSessionUser();
  if (!sessionUser) throw new Error("MUST_LOGIN");

  const { data: meetup } = await supabase
    .from("meetups")
    .select("start_at")
    .eq("post_id", meetupPostId)
    .single();

  if (meetup && new Date(meetup.start_at) <= new Date()) {
    throw new Error("CANCEL_AFTER_START");
  }

  const { error } = await supabase
    .from("meetup_participants")
    .update({ status: "cancelled" } as never)
    .eq("meetup_post_id", meetupPostId)
    .eq("user_id", sessionUser.id);

  if (error) throw new Error("CANCEL_JOIN_FAILED");

  await postSystemMessageForMeetup(meetupPostId, `${sessionUser.name}님이 나갔습니다.`);
}

export async function hostEndMeetup(postId: number): Promise<void> {
  const supabase = await createClient();
  const sessionUser = await getSessionUser();
  if (!sessionUser) throw new Error("MUST_LOGIN");

  const { data: post, error: fetchError } = await supabase
    .from("posts")
    .select("user_id")
    .eq("id", postId)
    .single();

  if (fetchError) throw fetchError;
  if (!post || (post as { user_id: number }).user_id !== sessionUser.id) {
    throw new Error("NOT_HOST");
  }

  const { error } = await supabase
    .from("posts")
    .update({ status: "inactive" } as never)
    .eq("id", postId);

  if (error) throw error;

  
  
  await supabase
    .from("meetups")
    .update({ post_id: postId } as never)
    .eq("post_id", postId);

  await endRoom(postId);
}

export async function adminGetMeetups(): Promise<AdminMeetup[]> {
  await requireAdmin();
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("meetups")
    .select(
      `
      *,
      posts!inner ( title, user_id, status, created_at, users!posts_user_id_fkey ( name ) ),
      meetup_participants ( id, user_id, status, users ( name ) )
    `,
    )
    .order("start_at", { ascending: false });

  if (error) throw error;

  const rows = (data ?? []) as unknown as AdminMeetupRow[];
  const postIds = rows.map((row) => row.post_id);
  const { data: reportRows } = postIds.length
    ? await admin
        .from("common_reports")
        .select("target_id")
        .eq("target_type", "post")
        .in("target_id", postIds)
    : { data: [] as { target_id: number | null }[] };

  const reportCounts = new Map<number, number>();
  for (const r of reportRows ?? []) {
    if (r.target_id == null) continue;
    reportCounts.set(r.target_id, (reportCounts.get(r.target_id) ?? 0) + 1);
  }

  const now = new Date();

  return rows.map((row) => {
    const startAt = new Date(row.start_at);
    const endAt = new Date(row.end_at);
    let status: "active" | "upcoming" | "ended" = "upcoming";
    if (row.posts.status === "inactive" || endAt < now) status = "ended";
    else if (startAt <= now) status = "active";

    const joined = (row.meetup_participants ?? []).filter((p) => p.status === "joined");
    const hostName = row.posts.users?.name ?? "알 수 없음";

    return {
      post_id: row.post_id,
      topic: row.topic,
      start_at: row.start_at,
      end_at: row.end_at,
      location_lat: row.location_lat,
      location_lng: row.location_lng,
      location_address: row.location_address,
      location_detail: row.location_detail,
      description: row.description,
      max_participants: row.max_participants,
      title: row.posts.title,
      host_id: row.posts.user_id,
      host_name: hostName,
      host_initial: hostName.charAt(0),
      status,
      participant_count: joined.length,
      participants: joined.map((p) => ({
        id: p.id,
        user_id: p.user_id,
        status: p.status,
        display_name: p.users?.name ?? "알 수 없음",
      })),
      reports: reportCounts.get(row.post_id) ?? 0,
      created_at: row.posts.created_at,
    };
  });
}

export async function adminForceEndMeetup(postId: number): Promise<void> {
  await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin
    .from("posts")
    .update({ status: "inactive" } as never)
    .eq("id", postId);
  if (error) throw error;

  
  
  await admin
    .from("meetups")
    .update({ post_id: postId } as never)
    .eq("post_id", postId);

  await endRoom(postId);
}
