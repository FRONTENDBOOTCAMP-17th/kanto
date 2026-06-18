import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import {
  VERIFICATION_TTL_SECONDS,
  createVerificationCode,
  saveVerificationCode,
  getSavedVerificationCode,
  deleteVerificationCode,
  sendVerificationEmail,
} from "@/utils/verificationCode";

function getVerificationKey(userId: string, email: string) {
  return `profile_verification:${userId}:${email.toLowerCase()}`;
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
