"use client";

import { ProfileCard } from "@/app/profile/_components/ProfileCard";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter();

  return (
    <ProfileCard
      user={{ name: "김도혁", email: "example@email.com" }}
      onBack={() => router.back()}
      onLogout={() => {}}
    />
  );
}