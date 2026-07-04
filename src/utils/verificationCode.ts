
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
  }
}

interface SendVerificationEmailOptions {
  subject?: string;
  intro?: string;
  validityNote?: string;
}

let cachedTransporter: ReturnType<typeof nodemailer.createTransport> | null = null;
let cachedTransporterKey = "";

export function isVerificationEmailConfigured() {
  return Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
}

function getVerificationEmailTransporter(user: string, pass: string) {
  const key = `${user}:${pass}`;

  if (cachedTransporter && cachedTransporterKey === key) {
    return cachedTransporter;
  }

  cachedTransporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
  cachedTransporterKey = key;

  return cachedTransporter;
}

export async function sendVerificationEmail(
  email: string,
  name: string,
  code: string,
  options: SendVerificationEmailOptions = {},
) {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    return { isEmailSent: false, isConfigured: false };
  }

  const subject = options.subject ?? "[Kanto] 본인인증 인증번호";
  const intro = options.intro ?? `${name}님, Kanto 본인인증을 위한 인증번호입니다.`;
  const validityNote = options.validityNote ?? "인증번호는 발송 시점부터 3분 동안 유효합니다.";

  const transporter = getVerificationEmailTransporter(user, pass);
  await transporter.sendMail({
    from: `Kanto <${user}>`,
    to: email,
    subject,
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
        <p>${intro}</p>
        <p style="font-size:28px;font-weight:700;letter-spacing:4px">${code}</p>
        <p>${validityNote}</p>
      </div>
    `,
  });

  return { isEmailSent: true, isConfigured: true };
}
