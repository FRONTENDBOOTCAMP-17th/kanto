import type {
  CategoryScores,
  ModerationCategory,
  ModerationResult,
} from "./types";

const DEFAULT_THRESHOLDS: CategoryScores = {
  adult: 0.7,
  violence: 0.7,
  hate: 0.7,
  illegal: 0.7,
};

const REASON_LABELS: Record<ModerationCategory, string> = {
  adult: "성인/노출",
  violence: "폭력/유혈",
  hate: "혐오/극단주의",
  illegal: "불법/위험물",
};

export function applyPolicy(
  scores: CategoryScores,
  provider: string,
  policyOverride?: Partial<CategoryScores>,
): ModerationResult {
  const thresholds = { ...DEFAULT_THRESHOLDS, ...policyOverride };
  const categories = {} as ModerationResult["categories"];
  const flaggedReasons: string[] = [];

  for (const category of Object.keys(
    DEFAULT_THRESHOLDS,
  ) as ModerationCategory[]) {
    const score = scores[category];
    const flagged = score >= thresholds[category];
    categories[category] = { score, flagged };
    if (flagged) flaggedReasons.push(REASON_LABELS[category]);
  }

  const blocked = flaggedReasons.length > 0;
  return {
    allowed: !blocked,
    action: blocked ? "block" : "allow",
    categories,
    reason: blocked ? flaggedReasons.join(", ") : null,
    provider,
    degraded: false,
  };
}
