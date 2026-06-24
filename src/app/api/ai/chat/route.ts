import { Redis } from "@upstash/redis";
import { NextRequest } from "next/server";
import Cerebras from "@cerebras/cerebras_cloud_sdk";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const cerebras = new Cerebras({
  apiKey: process.env.CEREBRAS_API_KEY!,
});

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  const key = `ai_chat:${ip}`;
  const count = (await redis.get<number>(key)) ?? 0;

  if (count >= 10) {
    return Response.json({ error: "rate_limit" }, { status: 429 });
  }

  await redis.incr(key);
  await redis.expire(key, 60);

  const { messages } = await req.json();

  const trimmed = messages.slice(-10);

  const stream = await cerebras.chat.completions.create({
    model: "llama-3.3-70b",
    messages: [{ role: "system", content: "SYSTEM_PROMPT" }, ...trimmed],
    stream: true,
    max_tokens: 1024,
  });

  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const delta =
            (chunk as { choices: { delta: { content?: string } }[] }).choices[0]
              ?.delta?.content ?? "";

          if (delta) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ delta })}\n\n`),
            );
          }
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      } catch {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ error: "service_unavailable" })}\n\n`,
          ),
        );
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
