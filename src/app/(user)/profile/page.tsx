import type { Metadata } from "next";
import { ProfileCard } from "@/app/(user)/profile/_components/ProfileCard";
import { profileOverview } from "@/services/profile/profileOverview";

export const metadata: Metadata = {
  robots: { index: false },
};

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const overview = await profileOverview();

  return (
    <div className="bg-white">
      <div className="max-w-lg md:max-w-5xl mx-auto py-8">
        <ProfileCard overview={overview} initialTab={tab}/>
      </div>
    </div>
  );
}
