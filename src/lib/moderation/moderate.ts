import { groqProvider } from "./providers/groq";
import { applyPolicy } from "./policy";
import type { CategoryScores, ModerationResult } from "./types";

const TIMEOUT_MS = 8000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("moderation_timeout")), ms),
    ),
  ]);
}

export async function moderateImage(
  imageBase64: string,
  mime: string,
  policyOverride?: Partial<CategoryScores>,
): Promise<ModerationResult> {
  try {
    const scores = await withTimeout(
      groqProvider.moderate(imageBase64, mime),
      TIMEOUT_MS,
    );
    return applyPolicy(scores, groqProvider.name, policyOverride);
  } catch (err) {
    console.warn("[ImageModeration] Groq 실패, fail-closed 처리:", err);
  }

  // fail-closed: 제공자 실패 시 통과시키지 않고 재시도를 유도한다.
  return {
    allowed: false,
    action: "review",
    categories: {
      adult: { score: 0, flagged: false },
      violence: { score: 0, flagged: false },
      hate: { score: 0, flagged: false },
      illegal: { score: 0, flagged: false },
    },
    reason: "unavailable",
    provider: "none",
    degraded: true,
  };
}
