export type ModerationCategory = "adult" | "violence" | "hate" | "illegal";

export type CategoryScores = Record<ModerationCategory, number>;

export interface ModerationProvider {
  name: string;
  moderate(imageBase64: string, mime: string): Promise<CategoryScores>;
}

export type ModerationAction = "allow" | "block" | "review";

export interface ModerationResult {
  allowed: boolean;
  action: ModerationAction;
  categories: Record<ModerationCategory, { score: number; flagged: boolean }>;
  reason: string | null;
  provider: string;
  degraded: boolean;
}
