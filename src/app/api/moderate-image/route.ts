import { Redis } from "@upstash/redis";
import { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { moderateImage } from "@/lib/moderation/moderate";
import type { CategoryScores } from "@/lib/moderation/types";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

const RATE_LIMIT = 30;
const RATE_WINDOW_SEC = 60;

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  const key = `moderate_image:${ip}`;
  const count = (await redis.get<number>(key)) ?? 0;
  if (count >= RATE_LIMIT) {
    return Response.json({ error: "rate_limit" }, { status: 429 });
  }
  await redis.incr(key);
  await redis.expire(key, RATE_WINDOW_SEC);

  const { image, policy } = (await req.json()) as {
    image?: string;
    policy?: Partial<CategoryScores>;
  };

  if (!image || !image.startsWith("data:")) {
    return Response.json({ error: "invalid_image" }, { status: 400 });
  }

  const [header, base64] = image.split(",");
  const mime = header.match(/data:(.*);base64/)?.[1] ?? "image/jpeg";

  const startedAt = Date.now();
  const result = await moderateImage(base64, mime, policy);

  return Response.json({
    requestId: randomUUID(),
    ...result,
    latencyMs: Date.now() - startedAt,
  });
}
