// 이메일 인증번호 공용 유틸
// - 본인인증(/api/profile/verification)과 비밀번호 재설정(/api/auth/reset-password)에서 공유한다.
// - Redis가 있으면 Redis, 없으면 메모리 fallback에 인증번호를 저장한다.
// - 메일 발송은 Gmail SMTP. GMAIL_USER/GMAIL_APP_PASSWORD가 없으면 발송을 건너뛰고 devCode를 표시한다.

import nodemailer from "nodemailer";
import { Redis } from "@upstash/redis";

export const VERIFICATION_TTL_SECONDS = 180;

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

const memoryVerificationCodes = new Map<string, { code: string; expiresAt: number }>();

export function createVerificationCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function saveVerificationCode(key: string, code: string) {
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

export async function getSavedVerificationCode(key: string) {
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

export async function deleteVerificationCode(key: string) {
  memoryVerificationCodes.delete(key);

  if (!redis) return;

  try {
    await redis.del(key);
  } catch {
    // Redis may be unavailable in local development.
  }
}

interface SendVerificationEmailOptions {
  subject?: string;
  intro?: string;
}

export async function sendVerificationEmail(
  email: string,
  name: string,
  code: string,
  options: SendVerificationEmailOptions = {},
) {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  // 메일 발송 키가 없으면 발송을 건너뛰고 개발용 코드를 화면에 표시한다.
  if (!user || !pass) {
    return { isEmailSent: false, isConfigured: false };
  }

  const subject = options.subject ?? "[Kanto] 본인인증 인증번호";
  const intro = options.intro ?? `${name}님, Kanto 본인인증을 위한 인증번호입니다.`;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });

  await transporter.sendMail({
    from: `Kanto <${user}>`,
    to: email,
    subject,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
        <p>${intro}</p>
        <p style="font-size:28px;font-weight:700;letter-spacing:4px">${code}</p>
        <p>인증번호는 발송 시점부터 3분 동안 유효합니다.</p>
      </div>
    `,
  });

  return { isEmailSent: true, isConfigured: true };
}
