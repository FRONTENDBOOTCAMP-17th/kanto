"use server";

// 번개모임(칸토 go!) Supabase 서버 액션
// 변이는 user 세션(RLS) 클라이언트, 알림/어드민은 admin 클라이언트 사용

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { getSessionUser, requireAdmin } from "@/services/user/user";
import { createRoomForMeetup, endRoom, postSystemMessageForMeetup } from "@/services/go/groupChat";
import type {
  Meetup,
  MeetupParticipant,
  CreateMeetupInput,
  AdminMeetup,
} from "@/type/go";

// ─── 사용자 API ──────────────────────────────────────────────

/**
 * 현재 진행 중인 번개모임 목록 조회
 * end_at > now() + posts.status = 'active' 로 종료/숨김 모임 자동 제외
 */
export async function getActiveMeetups(): Promise<Meetup[]> {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("meetups")
    .select(
      `
      *,
      posts!inner ( title, user_id, status, created_at, users!posts_user_id_fkey ( name ) ),
      meetup_participants ( status )
    `,
    )
    .gt("end_at", now)
    .eq("posts.status", "active")
    .order("start_at", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row: any) => ({
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
    participant_count: (row.meetup_participants ?? []).filter(
      (p: any) => p.status === "joined",
    ).length,
  }));
}

/**
 * 특정 모임 상세 조회 (joined 참여자 포함)
 */
export async function getMeetupDetail(postId: number): Promise<{
  meetup: Meetup;
  participants: MeetupParticipant[];
}> {
  const supabase = await createClient();

  const [meetupRes, participantsRes] = await Promise.all([
    supabase
      .from("meetups")
      .select(`*, posts!inner(title, user_id, status, users!posts_user_id_fkey(name))`)
      .eq("post_id", postId)
      .single(),
    supabase
      .from("meetup_participants")
      .select(`*, users(name, avatar_url)`)
      .eq("meetup_post_id", postId)
      .eq("status", "joined"),
  ]);

  if (meetupRes.error) throw meetupRes.error;
  if (participantsRes.error) throw participantsRes.error;

  const row = meetupRes.data as any;
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
    participants: (participantsRes.data ?? []).map((p: any) => ({
      id: p.id,
      meetup_post_id: p.meetup_post_id,
      user_id: p.user_id,
      joined_at: p.joined_at,
      status: p.status,
      display_name: p.users?.name ?? "알 수 없음",
      avatar_url: p.users?.avatar_url ?? null,
    })),
  };
}

/**
 * 번개모임 생성 — posts 행 → meetups 행 순서로 삽입. 생성된 post_id 반환.
 */
export async function createMeetup(input: CreateMeetupInput): Promise<number> {
  const supabase = await createClient();
  const sessionUser = await getSessionUser();
  if (!sessionUser) throw new Error("로그인이 필요합니다");

  const startAt = new Date(`${input.date}T${input.startTime}:00`).toISOString();
  const endAt = new Date(`${input.date}T${input.endTime}:00`).toISOString();

  // 1) posts 행 생성 (post_type = 'meetup')
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

  // 2) meetups 행 생성
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

/**
 * 모임 참여 + 주최자 알림
 */
export async function joinMeetup(meetupPostId: number): Promise<void> {
  const supabase = await createClient();
  const sessionUser = await getSessionUser();
  if (!sessionUser) throw new Error("로그인이 필요합니다");

  const { error } = await supabase.from("meetup_participants").insert({
    meetup_post_id: meetupPostId,
    user_id: sessionUser.id,
    status: "joined",
  } as never);

  if (error) throw error;

  await postSystemMessageForMeetup(meetupPostId, `${sessionUser.name}님이 참여했습니다.`);

  // 주최자 알림 (RLS 우회를 위해 admin 클라이언트 — 기존 알림 insert 패턴과 동일)
  const { data: meetupData } = await supabase
    .from("meetups")
    .select("posts!inner(user_id, title)")
    .eq("post_id", meetupPostId)
    .single();

  if (meetupData) {
    const hostId = (meetupData as any).posts.user_id as number;
    const title = (meetupData as any).posts.title as string;
    if (hostId !== sessionUser.id) {
      const admin = createAdminClient();
      await admin.from("common_notifications").insert({
        receiver_id: hostId,
        title: "새 참여자",
        body: `"${title}" 모임에 새 참여자가 합류했습니다!`,
        type: "meetup",
        related_type: "meetup",
        related_id: meetupPostId,
      } as never);
    }
  }
}

/**
 * 모임 참여 취소 (시작 전만 가능)
 */
export async function cancelJoin(meetupPostId: number): Promise<void> {
  const supabase = await createClient();
  const sessionUser = await getSessionUser();
  if (!sessionUser) throw new Error("로그인이 필요합니다");

  const { data: meetup } = await supabase
    .from("meetups")
    .select("start_at")
    .eq("post_id", meetupPostId)
    .single();

  if (meetup && new Date(meetup.start_at) <= new Date()) {
    throw new Error("모임 시작 후에는 참여를 취소할 수 없습니다");
  }

  const { error } = await supabase
    .from("meetup_participants")
    .update({ status: "cancelled" } as never)
    .eq("meetup_post_id", meetupPostId)
    .eq("user_id", sessionUser.id);

  if (error) throw error;

  await postSystemMessageForMeetup(meetupPostId, `${sessionUser.name}님이 나갔습니다.`);
}

/**
 * 주최자 모임 종료 — posts.status = 'inactive' (핀 자동 제거)
 * RLS 세션 클라이언트 사용. 호스트 본인 검증은 defense-in-depth로 명시적으로 한 번 더 수행.
 */
export async function hostEndMeetup(postId: number): Promise<void> {
  const supabase = await createClient();
  const sessionUser = await getSessionUser();
  if (!sessionUser) throw new Error("로그인이 필요합니다");

  const { data: post, error: fetchError } = await supabase
    .from("posts")
    .select("user_id")
    .eq("id", postId)
    .single();

  if (fetchError) throw fetchError;
  if (!post || (post as { user_id: number }).user_id !== sessionUser.id) {
    throw new Error("모임 주최자만 종료할 수 있습니다");
  }

  const { error } = await supabase
    .from("posts")
    .update({ status: "inactive" } as never)
    .eq("id", postId);

  if (error) throw error;

  // posts 테이블은 supabase_realtime publication에 없어 클라이언트가 변경을 못 감지함.
  // meetups 행을 touch(no-op update)해 publication에 등록된 테이블의 이벤트로 갱신을 트리거.
  await supabase
    .from("meetups")
    .update({ post_id: postId } as never)
    .eq("post_id", postId);

  await endRoom(postId);
}

// ─── 어드민 API ──────────────────────────────────────────────

/**
 * 어드민용 전체 모임 목록 (RLS 우회 admin 클라이언트)
 */
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

  const postIds = (data ?? []).map((row: any) => row.post_id);
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

  return (data ?? []).map((row: any) => {
    const startAt = new Date(row.start_at);
    const endAt = new Date(row.end_at);
    let status: "active" | "upcoming" | "ended" = "upcoming";
    if (row.posts.status === "inactive" || endAt < now) status = "ended";
    else if (startAt <= now) status = "active";

    const joined = (row.meetup_participants ?? []).filter(
      (p: any) => p.status === "joined",
    );
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
      participants: joined.map((p: any) => ({
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

/**
 * 어드민 강제 종료 — posts.status = 'inactive' (핀 자동 제거)
 */
export async function adminForceEndMeetup(postId: number): Promise<void> {
  await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin
    .from("posts")
    .update({ status: "inactive" } as never)
    .eq("id", postId);
  if (error) throw error;

  // posts 테이블은 supabase_realtime publication에 없어 클라이언트가 변경을 못 감지함.
  // meetups 행을 touch(no-op update)해 publication에 등록된 테이블의 이벤트로 갱신을 트리거.
  await admin
    .from("meetups")
    .update({ post_id: postId } as never)
    .eq("post_id", postId);

  await endRoom(postId);
}
