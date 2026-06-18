// 비밀번호 재설정 (로그인 전, 미인증 상태에서 동작)
// POST   : 이름+이메일 확인 후 인증번호 메일 발송
// PATCH  : 인증번호 검증 (코드는 유지)
// PUT    : 인증번호 재검증 후 새 비밀번호로 재설정
//
// 보안: 본인 확인은 "이메일로 받은 인증번호"로 한다. 이름+이메일은 계정 매칭용.

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

// 회원가입과 동일한 비밀번호 규칙 (영문 + 숫자 포함 8자 이상)
const PASSWORD_REGEX = /^(?=.*[a-zA-Z])(?=.*\d).{8,}$/;

function getResetKey(email: string) {
  return `password_reset:${email.toLowerCase()}`;
}

function admin() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
  );
}

// 이름+이메일이 일치하는 계정을 찾는다. (auth_id 반환)
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
  const { name, email } = (await req.json()) as { name?: string; email?: string };

  if (!name?.trim() || !email?.trim()) {
    return NextResponse.json({ error: "이름과 이메일을 입력해주세요." }, { status: 400 });
  }

  const matched = await findMatchingUser(name, email);

  if (!matched) {
    return NextResponse.json(
      { error: "입력하신 이름과 이메일에 일치하는 계정이 없습니다." },
      { status: 404 },
    );
  }

  const code = createVerificationCode();
  const key = getResetKey(email);
  await saveVerificationCode(key, code);

  let emailResult: { isEmailSent: boolean; isConfigured: boolean };
  try {
    emailResult = await sendVerificationEmail(email.trim().toLowerCase(), name.trim(), code, {
      subject: "[Kanto] 비밀번호 재설정 인증번호",
      intro: `${name.trim()}님, Kanto 비밀번호 재설정을 위한 인증번호입니다.`,
    });
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
  });
}

export async function PATCH(req: NextRequest) {
  const { email, code } = (await req.json()) as { email?: string; code?: string };

  if (!email?.trim() || !code?.trim()) {
    return NextResponse.json({ error: "이메일과 인증번호를 입력해주세요." }, { status: 400 });
  }

  const savedCode = await getSavedVerificationCode(getResetKey(email));

  if (!savedCode) {
    return NextResponse.json({ error: "인증 시간이 만료되었습니다." }, { status: 400 });
  }

  if (String(savedCode) !== code.trim()) {
    return NextResponse.json({ error: "인증번호가 일치하지 않습니다." }, { status: 400 });
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
    return NextResponse.json({ error: "필수 정보가 누락되었습니다." }, { status: 400 });
  }

  if (!PASSWORD_REGEX.test(newPassword)) {
    return NextResponse.json(
      { error: "비밀번호는 영문과 숫자를 포함하여 8자 이상이어야 합니다." },
      { status: 400 },
    );
  }

  const key = getResetKey(email);
  const savedCode = await getSavedVerificationCode(key);

  // 인증번호를 다시 검증해 인증 단계를 건너뛴 요청을 막는다.
  if (!savedCode || String(savedCode) !== code.trim()) {
    return NextResponse.json({ error: "인증이 만료되었거나 올바르지 않습니다." }, { status: 400 });
  }

  const matched = await findMatchingUser(name, email);

  if (!matched) {
    return NextResponse.json(
      { error: "입력하신 이름과 이메일에 일치하는 계정이 없습니다." },
      { status: 404 },
    );
  }

  const supabase = admin();
  const { error } = await supabase.auth.admin.updateUserById(matched.authId, {
    password: newPassword,
  });

  if (error) {
    return NextResponse.json({ error: "비밀번호 변경에 실패했습니다." }, { status: 500 });
  }

  await deleteVerificationCode(key);

  return NextResponse.json({ success: true });
}
