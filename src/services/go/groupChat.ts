"use server";

// 칸토 go! 번개모임 단체채팅 서비스
// 방 생성/종료/멤버 변이는 admin 클라이언트(RLS 우회), 읽기/메시지 작성은 세션 클라이언트(RLS)

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { getSessionUser } from "@/services/user/user";
import { getMeetupDetail } from "@/services/go/go";
import type { GroupChatRoom, GroupMessageWithSender, MyGroupRoom } from "@/type/groupChat";
import type { MeetupParticipant } from "@/type/go";

const GRACE_PERIOD_MS = 24 * 60 * 60 * 1000;

const GROUP_MESSAGE_SELECT = `id, room_id, sender_id, content, type, created_at,
    sender:users!meetup_chat_messages_sender_id_fkey(id, name, avatar_url, created_at)`;

/**
 * 모임 생성 직후 호출 — 채팅방 생성. 실패해도 모임 생성 자체는 막지 않음(비치명적).
 * expires_at = end_at + 24h (그라이스 기간), 첫 입장 시점에 lazy하게 재생성 가능.
 */
export async function createRoomForMeetup(meetupPostId: number, endAtISO: string): Promise<void> {
  try {
    const admin = createAdminClient();
    const expiresAt = new Date(new Date(endAtISO).getTime() + GRACE_PERIOD_MS).toISOString();
    const { error } = await admin.from("meetup_chat_rooms").insert({
      meetup_post_id: meetupPostId,
      expires_at: expiresAt,
      status: "active",
    } as never);
    if (error) throw error;
  } catch {
    // 방 생성 실패는 모임 생성 자체를 막지 않는다.
  }
}

/**
 * 모임 종료 시 호출 — 모임 채팅방을 즉시 삭제한다.
 * 메시지/읽음 상태는 FK cascade로 함께 제거되어 채팅 목록에서도 사라진다.
 */
export async function endRoom(meetupPostId: number): Promise<void> {
  try {
    const admin = createAdminClient();
    const room = await getRoomRowByMeetup(meetupPostId, admin);
    if (!room) return;

    await postSystemMessage(room.id, "모임이 종료되었습니다.");

    await admin
      .from("meetup_chat_rooms")
      .delete()
      .eq("id", room.id);
  } catch {
    // 종료 처리 중 채팅방 정리에 실패해도 모임 종료 자체는 유지한다.
  }
}

async function getRoomRowByMeetup(
  meetupPostId: number,
  client: ReturnType<typeof createAdminClient>,
): Promise<GroupChatRoom | null> {
  const { data } = await client
    .from("meetup_chat_rooms")
    .select("*")
    .eq("meetup_post_id", meetupPostId)
    .maybeSingle();
  return (data as GroupChatRoom) ?? null;
}

/**
 * 채팅방 조회 (RLS — 멤버만 통과). 만료된 방은 lazy 삭제 후 null 반환.
 */
export async function getRoomByMeetup(meetupPostId: number): Promise<GroupChatRoom | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("meetup_chat_rooms")
    .select("*")
    .eq("meetup_post_id", meetupPostId)
    .maybeSingle();

  const room = (data as GroupChatRoom) ?? null;
  if (!room) return null;

  if (new Date(room.expires_at) < new Date()) {
    try {
      const admin = createAdminClient();
      await admin.from("meetup_chat_rooms").delete().eq("id", room.id);
    } catch {
      // 만료 정리는 best-effort로 처리한다.
    }
    return null;
  }

  return room;
}

/**
 * 이 방에서 보이지 않아야 할 유저 id 집합 — 전역 차단(user_blocks) ∪ 이 방 전용 차단(meetup_chat_blocks).
 */
export async function getRoomBlockedIds(roomId: number, userId: number): Promise<Set<number>> {
  const supabase = await createClient();
  const [{ data: global }, { data: room }] = await Promise.all([
    supabase.from("user_blocks").select("blocked_id").eq("blocker_id", userId),
    supabase
      .from("meetup_chat_blocks")
      .select("blocked_id")
      .eq("room_id", roomId)
      .eq("blocker_id", userId),
  ]);
  return new Set([...(global ?? []).map((r) => r.blocked_id), ...(room ?? []).map((r) => r.blocked_id)]);
}

/**
 * 이 채팅에서만 차단 (room 범위, 프로필 차단 목록에는 노출되지 않음)
 */
export async function blockMemberInRoom(roomId: number, blockedId: number): Promise<void> {
  const supabase = await createClient();
  const sessionUser = await getSessionUser();
  if (!sessionUser) throw new Error("MUST_LOGIN");

  await supabase
    .from("meetup_chat_blocks")
    .upsert(
      { room_id: roomId, blocker_id: sessionUser.id, blocked_id: blockedId } as never,
      { onConflict: "room_id,blocker_id,blocked_id", ignoreDuplicates: true },
    );
}

/**
 * 이 채팅 전용 차단 해제
 */
export async function unblockMemberInRoom(roomId: number, blockedId: number): Promise<void> {
  const supabase = await createClient();
  const sessionUser = await getSessionUser();
  if (!sessionUser) throw new Error("MUST_LOGIN");

  await supabase
    .from("meetup_chat_blocks")
    .delete()
    .eq("room_id", roomId)
    .eq("blocker_id", sessionUser.id)
    .eq("blocked_id", blockedId);
}

/**
 * 방 메시지 페이지네이션 (50개, before 기준). 차단한 유저 메시지는 호출자가 필터링.
 */
export async function getRoomMessages(
  roomId: number,
  before?: string,
): Promise<GroupMessageWithSender[]> {
  const supabase = await createClient();
  let query = supabase.from("meetup_chat_messages").select(GROUP_MESSAGE_SELECT).eq("room_id", roomId);

  if (before) {
    query = query.lt("created_at", before);
  }

  const { data, error } = await query.order("created_at", { ascending: false }).limit(50);
  if (error) throw error;

  return (data as unknown as GroupMessageWithSender[]).reverse();
}

/**
 * 메시지 작성 (RLS — sender_id는 세션 유저로 강제)
 */
export async function postGroupMessage(roomId: number, content: string): Promise<GroupMessageWithSender> {
  const supabase = await createClient();
  const sessionUser = await getSessionUser();
  if (!sessionUser) throw new Error("MUST_LOGIN");

  const { data, error } = await supabase
    .from("meetup_chat_messages")
    .insert({
      room_id: roomId,
      sender_id: sessionUser.id,
      content,
      type: "text",
    } as never)
    .select(GROUP_MESSAGE_SELECT)
    .single();

  if (error) throw error;
  return data as unknown as GroupMessageWithSender;
}

/**
 * 시스템 메시지 (입장/퇴장/종료 안내) — admin으로 삽입, sender_id는 모임 호스트로 표기.
 */
export async function postSystemMessage(roomId: number, content: string): Promise<void> {
  try {
    const admin = createAdminClient();
    const { data: room, error: roomError } = await admin
      .from("meetup_chat_rooms")
      .select("meetup_post_id")
      .eq("id", roomId)
      .single();
    if (roomError || !room) return;

    const { data: meetup, error: meetupError } = await admin
      .from("meetups")
      .select("posts!inner(user_id)")
      .eq("post_id", room.meetup_post_id)
      .single();
    if (meetupError || !meetup) return;

    const hostId = (meetup as { posts: { user_id: number } } | null)?.posts.user_id;
    if (!hostId) return;

    await admin.from("meetup_chat_messages").insert({
      room_id: roomId,
      sender_id: hostId,
      content,
      type: "system",
    } as never);
  } catch {
    // 시스템 메시지는 보조 기능이라 실패해도 사용자 플로우를 깨지 않는다.
  }
}

/**
 * join/cancelJoin에서 호출 — meetupPostId 기준으로 방을 찾아 system 메시지 삽입.
 */
export async function postSystemMessageForMeetup(meetupPostId: number, content: string): Promise<void> {
  try {
    const admin = createAdminClient();
    const room = await getRoomRowByMeetup(meetupPostId, admin);
    if (!room) return;
    await postSystemMessage(room.id, content);
  } catch {
    // 시스템 메시지는 보조 기능이라 실패해도 사용자 플로우를 깨지 않는다.
  }
}

/**
 * "내 모임 채팅" 목록 — 내가 멤버인 방 + 마지막 메시지 미리보기 + unread.
 * RLS가 멤버 방만 select하게 해주므로, 전체 active+ended 방을 한 번에 긁어 가공.
 */
export async function getMyRooms(): Promise<MyGroupRoom[]> {
  const supabase = await createClient();
  const sessionUser = await getSessionUser();
  if (!sessionUser) return [];

  const { data: rooms, error } = await supabase
    .from("meetup_chat_rooms")
    .select(
      `id, meetup_post_id, status, expires_at,
       meetups!inner(topic, posts!inner(title), meetup_participants(status))`,
    )
    .order("created_at", { ascending: false });

  if (error) throw error;

  const now = new Date();
  const validRooms = (rooms ?? []).filter(
    (r) => r.status === "active" && new Date(r.expires_at) >= now,
  );
  const expiredRoomIds = (rooms ?? [])
    .filter((r) => new Date(r.expires_at) < now)
    .map((r) => r.id);

  if (expiredRoomIds.length > 0) {
    try {
      const admin = createAdminClient();
      await admin.from("meetup_chat_rooms").delete().in("id", expiredRoomIds);
    } catch {
      // 만료 정리는 목록 표시를 막지 않는다.
    }
  }

  if (validRooms.length === 0) return [];

  const roomIds = validRooms.map((r) => r.id);

  const [{ data: reads }, { data: lastMessages }] = await Promise.all([
    supabase
      .from("meetup_chat_reads")
      .select("room_id, last_read_at")
      .eq("user_id", sessionUser.id)
      .in("room_id", roomIds),
    supabase
      .from("meetup_chat_messages")
      .select("room_id, content, created_at, sender_id")
      .in("room_id", roomIds)
      .order("created_at", { ascending: false }),
  ]);

  const lastReadMap = new Map((reads ?? []).map((r) => [r.room_id, r.last_read_at]));
  const lastMessageMap = new Map<number, { content: string; created_at: string }>();
  const unreadCountMap = new Map<number, number>();

  for (const m of lastMessages ?? []) {
    if (!lastMessageMap.has(m.room_id)) {
      lastMessageMap.set(m.room_id, { content: m.content, created_at: m.created_at });
    }
    const lastRead = lastReadMap.get(m.room_id);
    if (m.sender_id !== sessionUser.id && (!lastRead || m.created_at > lastRead)) {
      unreadCountMap.set(m.room_id, (unreadCountMap.get(m.room_id) ?? 0) + 1);
    }
  }

  return validRooms.map((r) => {
    const meetup = (r as unknown as {
      meetups: {
        topic: string;
        posts: { title: string };
        meetup_participants?: Array<{ status: string }> | null;
      };
    }).meetups;
    const last = lastMessageMap.get(r.id);
    const participantCount =
      meetup.meetup_participants?.filter((p) => p.status === "joined").length ?? 0;
    return {
      room_id: r.id,
      meetup_post_id: r.meetup_post_id,
      title: meetup.posts.title,
      topic: meetup.topic as MyGroupRoom["topic"],
      status: r.status as "active" | "ended",
      member_count: participantCount + 1,
      last_message_content: last?.content ?? null,
      last_message_at: last?.created_at ?? null,
      unread_count: unreadCountMap.get(r.id) ?? 0,
    };
  });
}

/**
 * 읽음 처리 — last_read_at upsert.
 */
export async function markRoomRead(roomId: number): Promise<void> {
  const supabase = await createClient();
  const sessionUser = await getSessionUser();
  if (!sessionUser) return;

  await supabase.from("meetup_chat_reads").upsert(
    { room_id: roomId, user_id: sessionUser.id, last_read_at: new Date().toISOString() } as never,
    { onConflict: "room_id,user_id" },
  );
}

/**
 * 현재 사용자의 이 방 마지막 읽음 시각.
 */
export async function getRoomLastReadAt(roomId: number): Promise<string | null> {
  const supabase = await createClient();
  const sessionUser = await getSessionUser();
  if (!sessionUser) return null;

  const { data } = await supabase
    .from("meetup_chat_reads")
    .select("last_read_at")
    .eq("room_id", roomId)
    .eq("user_id", sessionUser.id)
    .maybeSingle();

  return data?.last_read_at ?? null;
}

/**
 * 방 멤버 목록 — 호스트 + joined 참여자.
 */
export async function getRoomMembers(meetupPostId: number): Promise<MeetupParticipant[]> {
  const { meetup, participants } = await getMeetupDetail(meetupPostId);

  const host: MeetupParticipant = {
    id: 0,
    meetup_post_id: meetupPostId,
    user_id: meetup.host_id,
    joined_at: "",
    status: "joined",
    display_name: meetup.host_name,
    avatar_url: null,
    is_host: true,
    is_deleted: false,
  };

  return [host, ...participants.map((p) => ({ ...p, is_host: false }))];
}
