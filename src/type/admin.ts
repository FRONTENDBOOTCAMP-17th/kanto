export type Category = "중고거래" | "커뮤니티" | "구인구직" | "방렌트";

export interface ReportedUser {
  user_id: number;
  name: string;
  avatar_url: string | null;
  report_count: number;
  latest_reason: string;
  first_reported_at: string;
}

export interface ReportedPost {
  post_id: number;
  title: string;
  post_type: string;
  report_count: number;
  latest_reason: string;
  first_reported_at: string;
}

export interface DashboardData {
  totalUsers: number;
  activeUsers: number;
  todaySignups: number;
  totalPosts: number;
  todayPosts: number;
  pendingTotal: number;
  pendingUser: number;
  pendingPost: number;
  oldestDays: number | null;
  sumSignups: string;
  signupValues: number[];
  xLabels: string[];
  donutData: { name: Category; value: number; pct: string }[];
  todayByCat: { name: Category; delta: number }[];
  topPosts: { rank: number; title: string; cat: Category; views: string }[];
  reportedUsers: ReportedUser[];
  reportedPosts: ReportedPost[];
  regions: { name: string; count: number }[];
  reportTypes: { name: string; count: number; pct: string; w: string; color: string }[];
  reportStats: { weekResolved: number; resolveRate: number; avgHours: number | null };
}

export type ReportType = "post" | "user";
export type Status = "pending" | "resolved" | "dismissed";
export type Sanction = "none" | "7d" | "30d" | "perm";

export interface Outcome {
  deactivated: boolean;
  sanctionLabel: string;
  target: string;
  resolvedDate: string;
}

export interface Report {
  id: number;
  type: ReportType;
  targetId: number;
  authorId?: number;
  targetName: string;
  category?: string;
  author?: string;
  reason: string;
  description: string;
  reportDate: string;
  createdAt?: string;
  status: Status;
  resolvedAt?: string | null;
  postDeactivated?: boolean;
  sanctionType?: Sanction | null;
  sanctionExpiresAt?: string | null;
  handledBy?: string | null;
}
