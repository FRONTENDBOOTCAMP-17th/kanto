"use client";

import { ProfileCard } from "@/app/(user)/profile/_components/ProfileCard";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white md:bg-teal-50">
      <div className="max-w-lg mx-auto py-8">
        <ProfileCard
          user={{ name: "김도혁", email: "example@email.com" }}
          onBack={() => router.back()}
          onLogout={() => {}}
        />
      </div>
    </div>
  );
}
