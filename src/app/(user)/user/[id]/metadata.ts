import type { Metadata } from "next";
import { getPublicProfile } from "@/services/user/publicProfile";
import { resolveUserId, encryptUserId } from "@/utils/userIdCipher";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const targetId = resolveUserId(id);
  if (targetId === null) return { title: "유저를 찾을 수 없습니다" };

  const profile = await getPublicProfile(targetId);

  if (!profile) return { title: "유저를 찾을 수 없습니다" };

  return {
    title: `${profile.name} 프로필`,
    description: `${profile.name}님의 칸토 프로필 페이지입니다.`,
    openGraph: {
      title: `${profile.name} 프로필`,
      description: `${profile.name}님의 칸토 프로필 페이지입니다.`,
      images: profile.avatarUrl
        ? [{ url: profile.avatarUrl, width: 400, height: 400, alt: `${profile.name} 프로필 사진` }]
        : [],
      type: "profile",
    },
    alternates: {
      canonical: `${process.env.NEXT_PUBLIC_BASE_URL!.replace(/\/$/, "")}/user/${encryptUserId(targetId)}`,
    },
  };
}
