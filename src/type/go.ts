import type { Tables } from "@/type/supabase";
import type { MeetupTopicKey } from "@/constants/meetupTopics";

type MeetupRow = Tables<"meetups">;

// 목록/상세에서 쓰는 enriched 모임 (posts 조인 + joined 참여자 수)
export interface Meetup extends Omit<MeetupRow, "topic"> {
  topic: MeetupTopicKey;
  title: string; // posts.title
  host_id: number; // posts.user_id (public.users.id)
  host_name: string; // users.name
  status: string; // posts.status ("active" | "inactive")
  participant_count: number; // joined 참여자 수 (주최자 별도)
}

// 상세 패널 참여자 (users 조인)
export interface MeetupParticipant {
  id: number;
  meetup_post_id: number;
  user_id: number;
  joined_at: string;
  status: "joined" | "cancelled";
  display_name: string; // users.name
  avatar_url: string | null;
  is_host?: boolean; // 단체채팅 멤버 목록에서 호스트 표시용
}

// 장소 자동완성으로 선택된 위치 (좌표 + 주소)
export interface PickedLocation {
  lat: number;
  lng: number;
  address: string; // formattedAddress (없으면 displayName)
  placeId?: string;
  // 마켓플레이스 거래지역 세분화용 (go 모임에서는 미사용) — addressComponents 에서 추출
  barangay?: string | null;
  city?: string | null;
  province?: string | null;
  displayName?: string | null; // 시 성분 없는 장소(랜드마크 등)의 라벨 폴백용
}

// 생성 모달 입력 (date/time → ISO 조합은 createMeetup에서 처리)
export interface CreateMeetupInput {
  title: string;
  topic: MeetupTopicKey;
  description: string;
  date: string; // "YYYY-MM-DD"
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  lat: number;
  lng: number;
  address: string;
  locationDetail?: string | null;
  maxParticipants: number;
}

// 어드민 테이블/Drawer용 합성 뷰
export interface AdminMeetup extends Meetup {
  host_initial: string;
  status: "active" | "upcoming" | "ended"; // 시간/강제종료 기준 계산값
  participants: { id: number; user_id: number; status: string; display_name: string }[];
  reports: number; // common_reports (target_type='post', target_id=post_id) 집계
  created_at: string; // posts.created_at
}
