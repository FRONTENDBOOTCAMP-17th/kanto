import { ProfileCard } from "@/app/(user)/profile/_components/ProfileCard";

export default function ProfilePage() {
  return (
    <div className="bg-white md:bg-teal-50">
      <div className="max-w-lg md:max-w-5xl mx-auto py-8">
        <ProfileCard />
      </div>
    </div>
  );
}
