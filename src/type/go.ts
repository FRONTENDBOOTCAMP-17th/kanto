import type { Tables } from "@/type/supabase";
import type { MeetupTopicKey } from "@/constants/meetupTopics";

type MeetupRow = Tables<"meetups">;

export interface Meetup extends Omit<MeetupRow, "topic"> {
  topic: MeetupTopicKey;
  title: string; 
  host_id: number; 
  host_name: string; 
  status: string; 
  participant_count: number; 
}

export interface MeetupParticipant {
  id: number;
  meetup_post_id: number;
  user_id: number;
  joined_at: string;
  status: "joined" | "cancelled";
  display_name: string; 
  avatar_url: string | null;
  is_host?: boolean; 
  is_deleted?: boolean; 
}

export interface PickedLocation {
  lat: number;
  lng: number;
  address: string; 
  placeId?: string;
  
  barangay?: string | null;
  city?: string | null;
  province?: string | null;
  displayName?: string | null; 
}

export interface CreateMeetupInput {
  title: string;
  topic: MeetupTopicKey;
  description: string;
  date: string; 
  startTime: string; 
  endTime: string; 
  lat: number;
  lng: number;
  address: string;
  locationDetail?: string | null;
  maxParticipants: number;
}

export interface AdminMeetup extends Meetup {
  host_initial: string;
  status: "active" | "upcoming" | "ended"; 
  participants: { id: number; user_id: number; status: string; display_name: string }[];
  reports: number; 
  created_at: string; 
}
