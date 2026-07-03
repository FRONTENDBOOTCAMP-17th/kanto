
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Database } from "@/type/supabase";
import {
  VERIFICATION_TTL_SECONDS,
  createVerificationCode,
  saveVerificationCode,
  getSavedVerificationCode,
  deleteVerificationCode,
  sendVerificationEmail,
} from "@/utils/verificationCode";

const PASSWORD_REGEX = /^(?=.*[a-zA-Z])(?=.*\d).{8,}$/;

// error 필드는 클라이언트(FindPasswordModal)가 FindPassword.errors.* 메시지 키로 번역하는 코드
const EMAIL_TEXTS: Record<string, { subject: string; intro: (name: string) => string; validityNote: string }> = {
  ko: {
    subject: "[Kanto] 비밀번호 재설정 인증번호",
    intro: (name) => `${name}님, Kanto 비밀번호 재설정을 위한 인증번호입니다.`,
    validityNote: "인증번호는 발송 시점부터 3분 동안 유효합니다.",
  },
  en: {
    subject: "[Kanto] Password reset verification code",
    intro: (name) => `${name}, here is your verification code to reset your Kanto password.`,
    validityNote: "This code is valid for 3 minutes after it is sent.",
  },
  fil: {
    subject: "[Kanto] Verification code para sa pag-reset ng password",
    intro: (name) => `${name}, narito ang iyong verification code para i-reset ang iyong Kanto password.`,
    validityNote: "Balido ang code na ito sa loob ng 3 minuto mula nang maipadala.",
  },
};

function getResetKey(email: string) {
  return `password_reset:${email.toLowerCase()}`;
}

function admin() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
  );
}

async function findMatchingUser(name: string, email: string) {
  const supabase = admin();
  const { data } = await supabase
    .from("users")
    .select("auth_id, name")
    .eq("email", email.toLowerCase())
    .maybeSingle();

  if (!data || !data.auth_id) return null;
  if (data.name.trim() !== name.trim()) return null;

  return { authId: data.auth_id };
}

export async function POST(req: NextRequest) {
  const { name, email, locale } = (await req.json()) as {
    name?: string;
    email?: string;
    locale?: string;
  };

  if (!name?.trim() || !email?.trim()) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  const matched = await findMatchingUser(name, email);

  if (!matched) {
    return NextResponse.json({ error: "account_not_found" }, { status: 404 });
  }

  const code = createVerificationCode();
  const key = getResetKey(email);
  await saveVerificationCode(key, code);

  const emailTexts = EMAIL_TEXTS[locale ?? "ko"] ?? EMAIL_TEXTS.ko;

  let emailResult: { isEmailSent: boolean; isConfigured: boolean };
  try {
    emailResult = await sendVerificationEmail(email.trim().toLowerCase(), name.trim(), code, {
      subject: emailTexts.subject,
      intro: emailTexts.intro(name.trim()),
      validityNote: emailTexts.validityNote,
    });
  } catch {
    await deleteVerificationCode(key);
    return NextResponse.json({ error: "email_send_failed" }, { status: 502 });
  }

  const isProduction = process.env.NODE_ENV === "production";

  if (!emailResult.isConfigured && isProduction) {
    await deleteVerificationCode(key);
    return NextResponse.json({ error: "email_not_configured" }, { status: 500 });
  }

  return NextResponse.json({
    expiresIn: VERIFICATION_TTL_SECONDS,
    isEmailSent: emailResult.isEmailSent,
    devCode: !emailResult.isConfigured && !isProduction ? code : undefined,
  });
}

export async function PATCH(req: NextRequest) {
  const { email, code } = (await req.json()) as { email?: string; code?: string };

  if (!email?.trim() || !code?.trim()) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  const savedCode = await getSavedVerificationCode(getResetKey(email));

  if (!savedCode) {
    return NextResponse.json({ error: "code_expired" }, { status: 400 });
  }

  if (String(savedCode) !== code.trim()) {
    return NextResponse.json({ error: "code_mismatch" }, { status: 400 });
  }

  return NextResponse.json({ verified: true });
}

export async function PUT(req: NextRequest) {
  const { name, email, code, newPassword } = (await req.json()) as {
    name?: string;
    email?: string;
    code?: string;
    newPassword?: string;
  };

  if (!name?.trim() || !email?.trim() || !code?.trim() || !newPassword) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  if (!PASSWORD_REGEX.test(newPassword)) {
    return NextResponse.json({ error: "invalid_password" }, { status: 400 });
  }

  const key = getResetKey(email);
  const savedCode = await getSavedVerificationCode(key);

  if (!savedCode || String(savedCode) !== code.trim()) {
    return NextResponse.json({ error: "code_invalid_or_expired" }, { status: 400 });
  }

  const matched = await findMatchingUser(name, email);

  if (!matched) {
    return NextResponse.json({ error: "account_not_found" }, { status: 404 });
  }

  const supabase = admin();
  const { error } = await supabase.auth.admin.updateUserById(matched.authId, {
    password: newPassword,
  });

  if (error) {
    return NextResponse.json({ error: "update_failed" }, { status: 500 });
  }

  await deleteVerificationCode(key);

  return NextResponse.json({ success: true });
}
