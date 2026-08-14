import { NextResponse } from "next/server";
import { requireAdmin, requireSuperAdmin } from "@/services/user/user";
import type { User } from "@/type/user";

export async function requireAdminOrApiError(): Promise<User | NextResponse> {
  try {
    return await requireAdmin();
  } catch {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }
}

export async function requireSuperAdminOrApiError(): Promise<User | NextResponse> {
  try {
    return await requireSuperAdmin();
  } catch {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }
}
