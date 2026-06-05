export interface Post {
  id: number;
  created_at: string;
  user_id: number;
  post_type: string;
  title: string;
  status: string;
  view_count: number;
  like_count: number;
  updated_at: string | null;
}
