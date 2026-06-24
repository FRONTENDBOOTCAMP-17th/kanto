import { Redis } from "@upstash/redis";
import { NextRequest } from "next/server";
import {
  GoogleGenerativeAI,
  type GenerateContentStreamResult,
} from "@google/generative-ai";
import OpenAI from "openai";
import fs from "fs";
import path from "path";

// ── 지식베이스 파싱 ──────────────────────────────────────────
interface KBSection {
  title: string;
  content: string;
}

const ALWAYS_INCLUDE = new Set([
  "서비스 소개",
  "챗봇 운영 지침",
  "고객센터 안내",
]);

function parseKB(raw: string): { preamble: string; sections: KBSection[] } {
  const firstSection = raw.indexOf("\n## ");
  const preamble = firstSection > -1 ? raw.slice(0, firstSection).trim() : "";
  const blocks = raw.split(/\n(?=## )/).slice(1);
  const sections: KBSection[] = blocks.map((block) => {
    const newline = block.indexOf("\n");
    const title = block.slice(3, newline).trim();
    return { title, content: block.trim() };
  });
  return { preamble, sections };
}

function findRelevantSections(query: string, sections: KBSection[], topN = 3) {
  const q = query.toLowerCase();
  const words = q.split(/\s+/).filter((w) => w.length > 1);
  return sections
    .filter((s) => !ALWAYS_INCLUDE.has(s.title))
    .map((s) => ({
      s,
      score: words.filter((w) => (s.title + s.content).toLowerCase().includes(w)).length,
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topN)
    .map(({ s }) => s);
}

const raw = fs.readFileSync(
  path.join(process.cwd(), "src/app/api/ai/chat/knowledge.md"),
  "utf-8",
);
const { preamble, sections } = parseKB(raw);
const alwaysSections = sections.filter((s) => ALWAYS_INCLUDE.has(s.title));

// ── 클라이언트 초기화 ────────────────────────────────────────
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

function getGroq() {
  return new OpenAI({
    apiKey: process.env.GROQ_API_KEY!,
    baseURL: "https://api.groq.com/openai/v1",
  });
}

function getCerebras() {
  return new OpenAI({
    apiKey: process.env.CEREBRAS_API_KEY!,
    baseURL: "https://api.cerebras.ai/v1",
  });
}

const RATE_LIMIT = 10;
const RATE_WINDOW_SEC = 60;
const MAX_MESSAGES = 10;

// ── 스트리밍 헬퍼 ────────────────────────────────────────────
async function streamGemini(
  systemPrompt: string,
  trimmed: { role: string; content: string }[],
): Promise<GenerateContentStreamResult> {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: systemPrompt,
  });
  const historyMapped = trimmed.slice(0, -1).map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
  const firstUserIdx = historyMapped.findIndex((m) => m.role === "user");
  const history = firstUserIdx >= 0 ? historyMapped.slice(firstUserIdx) : [];
  const chat = model.startChat({ history });
  return chat.sendMessageStream(trimmed[trimmed.length - 1].content);
}

const LLAMA_LANGUAGE_GUARD = `You are a Korean-language customer support assistant for Kanto platform.
CRITICAL: Always respond in pure Korean (한국어). NEVER use Chinese characters, Russian, Japanese, or any non-Korean script. NEVER mix foreign words into Korean sentences.
If user writes in English → respond in English. If Filipino/Tagalog → respond in Filipino.\n\n`;

async function streamGroq(
  systemPrompt: string,
  trimmed: { role: string; content: string }[],
) {
  return getGroq().chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: LLAMA_LANGUAGE_GUARD + systemPrompt },
      ...trimmed.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ],
    stream: true,
  });
}

async function streamCerebras(
  systemPrompt: string,
  trimmed: { role: string; content: string }[],
) {
  return getCerebras().chat.completions.create({
    model: "llama-3.3-70b",
    messages: [
      { role: "system", content: LLAMA_LANGUAGE_GUARD + systemPrompt },
      ...trimmed.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ],
    stream: true,
  });
}

// ── Route Handler ────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  const key = `ai_chat:${ip}`;
  const count = (await redis.get<number>(key)) ?? 0;
  if (count >= RATE_LIMIT) {
    return Response.json({ error: "rate_limit" }, { status: 429 });
  }
  await redis.incr(key);
  await redis.expire(key, RATE_WINDOW_SEC);

  const { messages } = await req.json();
  const trimmed: { role: string; content: string }[] =
    messages.slice(-MAX_MESSAGES);

  const lastUserMsg =
    [...trimmed].reverse().find((m) => m.role === "user")?.content ?? "";
  const relevantSections = findRelevantSections(lastUserMsg, sections);
  const systemPrompt = [
    preamble,
    ...alwaysSections.map((s) => s.content),
    ...relevantSections.map((s) => s.content),
  ]
    .filter(Boolean)
    .join("\n\n---\n\n");

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      const send = (delta: string) =>
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ delta })}\n\n`),
        );
      const done = () =>
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));

      // 1차: Gemini (최대 3회 재시도)
      let geminiResult: GenerateContentStreamResult | null = null;
      let useGroqFallback = false;

      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          geminiResult = await streamGemini(systemPrompt, trimmed);
          break;
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : "";
          const isTransient = msg.includes("503") || msg.includes("429");
          if (isTransient && attempt < 2) {
            await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
            continue;
          }
          console.warn("[AI Chat] Gemini 실패, Groq으로 폴백:", msg);
          useGroqFallback = true;
          break;
        }
      }

      try {
        if (!useGroqFallback && geminiResult) {
          // 1차: Gemini
          for await (const chunk of geminiResult.stream) {
            const delta = chunk.text();
            if (delta) send(delta);
          }
        } else {
          // 2차 폴백: Groq → 실패 시 3차: Cerebras
          let openaiStream: AsyncIterable<OpenAI.Chat.ChatCompletionChunk>;
          try {
            openaiStream = await streamGroq(systemPrompt, trimmed);
          } catch (groqErr) {
            console.warn("[AI Chat] Groq 실패, Cerebras로 폴백:", groqErr);
            openaiStream = await streamCerebras(systemPrompt, trimmed);
          }
          for await (const chunk of openaiStream) {
            const delta = chunk.choices[0]?.delta?.content;
            if (delta) send(delta);
          }
        }
        done();
      } catch (err) {
        console.error("[AI Chat] 최종 실패:", err);
        send("죄송합니다, 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
        done();
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
