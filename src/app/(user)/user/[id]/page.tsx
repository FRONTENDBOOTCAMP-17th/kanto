import { notFound, redirect } from "next/navigation";
import { getCurrentUserId } from "@/services/user/user";
import { getPublicProfile } from "@/services/user/publicProfile";
import { getReviewsForUser } from "@/services/review/review";
import { hasBlockedUser } from "@/services/chat/block";
import { PublicProfileView } from "./_components/PublicProfileView";
export { generateMetadata } from "./metadata";

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const targetId = Number(id);
  if (!Number.isInteger(targetId) || targetId <= 0) notFound();

  const currentUserId = await getCurrentUserId();
  if (currentUserId === targetId) redirect("/profile");

  const [profile, reviews, initialBlocked] = await Promise.all([
    getPublicProfile(targetId),
    getReviewsForUser(targetId),
    currentUserId
      ? hasBlockedUser(currentUserId, targetId)
      : Promise.resolve(false),
  ]);

  if (!profile) notFound();

  return (
    <div className="bg-white md:bg-teal-50 min-h-screen">
      <div className="max-w-lg mx-auto md:py-8">
        <PublicProfileView
          profile={profile}
          reviews={reviews}
          currentUserId={currentUserId}
          initialBlocked={initialBlocked}
        />
      </div>
    </div>
  );
}
