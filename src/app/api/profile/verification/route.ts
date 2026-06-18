import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

const VERIFICATION_TTL_SECONDS = 180;

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

const memoryVerificationCodes = new Map<string, { code: string; expiresAt: number }>();

function createVerificationCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function getVerificationKey(userId: string, email: string) {
  return `profile_verification:${userId}:${email.toLowerCase()}`;
}

async function saveVerificationCode(key: string, code: string) {
  if (!redis) {
    memoryVerificationCodes.set(key, {
      code,
      expiresAt: Date.now() + VERIFICATION_TTL_SECONDS * 1000,
    });
    return "memory";
  }

  try {
    await redis.set(key, code, { ex: VERIFICATION_TTL_SECONDS });
    return "redis";
  } catch {
    memoryVerificationCodes.set(key, {
      code,
      expiresAt: Date.now() + VERIFICATION_TTL_SECONDS * 1000,
    });
    return "memory";
  }
}

async function getSavedVerificationCode(key: string) {
  if (redis) {
    try {
      const redisCode = await redis.get<string>(key);
      if (redisCode) return redisCode;
    } catch {
      // Use the local fallback below when Redis is unavailable in development.
    }
  }

  const memoryCode = memoryVerificationCodes.get(key);

  if (!memoryCode) return null;

  if (memoryCode.expiresAt <= Date.now()) {
    memoryVerificationCodes.delete(key);
    return null;
  }

  return memoryCode.code;
}

async function deleteVerificationCode(key: string) {
  memoryVerificationCodes.delete(key);

  if (!redis) return;

  try {
    await redis.del(key);
  } catch {
    // Redis may be unavailable in local development.
  }
}

async function sendVerificationEmail(email: string, name: string, code: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    return { isEmailSent: false, isConfigured: false };
  }

  if (from.includes("your-domain.com")) {
    throw new Error("RESEND_FROM_EMAIL을 Resend에서 검증한 실제 발신 주소로 변경해주세요.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: email,
      subject: "[Kanto] 본인인증 인증번호",
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
          <p>${name}님, Kanto 본인인증을 위한 인증번호입니다.</p>
          <p style="font-size:28px;font-weight:700;letter-spacing:4px">${code}</p>
          <p>인증번호는 발송 시점부터 3분 동안 유효합니다.</p>
        </div>
      `,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "email_send_failed");
  }

  return { isEmailSent: true, isConfigured: true };
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: "인증되지 않은 요청입니다." }, { status: 401 });
  }

  const { name, email } = (await req.json()) as { name?: string; email?: string };

  if (!name?.trim() || !email?.trim()) {
    return NextResponse.json({ error: "이름과 이메일을 입력해주세요." }, { status: 400 });
  }

  const code = createVerificationCode();
  const normalizedEmail = email.trim().toLowerCase();
  const key = getVerificationKey(user.id, normalizedEmail);

  const storage = await saveVerificationCode(key, code);
  let emailResult: { isEmailSent: boolean; isConfigured: boolean };

  try {
    emailResult = await sendVerificationEmail(normalizedEmail, name.trim(), code);
  } catch (error) {
    await deleteVerificationCode(key);
    const message = error instanceof Error ? error.message : "인증번호 이메일 발송에 실패했습니다.";

    return NextResponse.json(
      { error: `인증번호 이메일 발송에 실패했습니다. ${message}` },
      { status: 502 },
    );
  }

  return NextResponse.json({
    expiresIn: VERIFICATION_TTL_SECONDS,
    isEmailSent: emailResult.isEmailSent,
    devCode: emailResult.isConfigured ? undefined : code,
    storage,
  });
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ error: "인증되지 않은 요청입니다." }, { status: 401 });
  }

  const { email, code } = (await req.json()) as { email?: string; code?: string };

  if (!email?.trim() || !code?.trim()) {
    return NextResponse.json({ error: "이메일과 인증번호를 입력해주세요." }, { status: 400 });
  }

  const key = getVerificationKey(user.id, email.trim().toLowerCase());
  const savedCode = await getSavedVerificationCode(key);

  if (!savedCode) {
    return NextResponse.json({ error: "인증 시간이 만료되었습니다." }, { status: 400 });
  }

  if (String(savedCode) !== code.trim()) {
    return NextResponse.json({ error: "인증번호가 일치하지 않습니다." }, { status: 400 });
  }

  await deleteVerificationCode(key);

  await supabase.auth.updateUser({ data: { identity_verified: true } });

  return NextResponse.json({ verified: true });
}
