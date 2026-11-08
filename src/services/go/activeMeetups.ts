import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/type/supabase";
import type { Meetup } from "@/type/go";
import { encryptPostId } from "@/utils/postIdCipher";

// "use server" 파일(go.ts) 밖에 둔 진행 중 모임 조회 로직.
// 메인 페이지(ISR)는 공개 클라이언트로, 서버 액션은 세션 클라이언트로 같은 쿼리를 쓴다.

type MeetupParticipantStatusRow = { status: string };

export type MeetupRow = {
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

export async function queryActiveMeetups(
  supabase: SupabaseClient<Database>,
  range?: { offset: number; limit: number },
): Promise<Meetup[]> {
  const now = new Date().toISOString();

  let query = supabase
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

  if (range) {
    query = query.range(range.offset, range.offset + range.limit - 1);
  }

  const { data, error } = await query;

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
    id_token: encryptPostId(row.post_id),
  }));
}
