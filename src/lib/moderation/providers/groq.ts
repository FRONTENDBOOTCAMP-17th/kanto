import OpenAI from "openai";
import type { CategoryScores, ModerationProvider } from "../types";

const MODERATION_PROMPT = `이미지를 분석해 다음 4개 카테고리 각각에 대해 0~1 사이 확률을 매겨라:
- adult: 성인/노출 콘텐츠
- violence: 폭력/유혈 콘텐츠
- hate: 혐오/극단주의 콘텐츠
- illegal: 불법/위험물 콘텐츠

오직 아래 형식의 JSON으로만 답하라. 다른 텍스트를 포함하지 마라.
{"adult": 0.0, "violence": 0.0, "hate": 0.0, "illegal": 0.0}`;

function getGroq() {
  return new OpenAI({
    apiKey: process.env.GROQ_API_KEY!,
    baseURL: "https://api.groq.com/openai/v1",
  });
}

async function callGroq(imageBase64: string, mime: string): Promise<CategoryScores> {
  const result = await getGroq().chat.completions.create({
    model: "meta-llama/llama-4-scout-17b-16e-instruct",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: MODERATION_PROMPT },
          {
            type: "image_url",
            image_url: { url: `data:${mime};base64,${imageBase64}` },
          },
        ],
      },
    ],
  });

  const parsed = JSON.parse(result.choices[0]?.message?.content ?? "{}");
  return {
    adult: Number(parsed.adult) || 0,
    violence: Number(parsed.violence) || 0,
    hate: Number(parsed.hate) || 0,
    illegal: Number(parsed.illegal) || 0,
  };
}

export const groqProvider: ModerationProvider = {
  name: "llama-4-scout",
  async moderate(imageBase64, mime) {
    let lastErr: unknown;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        return await callGroq(imageBase64, mime);
      } catch (err: unknown) {
        lastErr = err;
        const msg = err instanceof Error ? err.message : "";
        const isTransient = msg.includes("503") || msg.includes("429");
        if (isTransient && attempt < 2) {
          await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
          continue;
        }
        break;
      }
    }
    throw lastErr;
  },
};
