import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { ProfileCard } from "@/app/(user)/profile/_components/ProfileCard";
import type { AlertSettings } from "@/hooks/profile/useAlertSettings";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("users")
    .select("alert_chat, alert_comment, alert_post, interest_categories, alert_keywords")
    .eq("auth_id", user.id)
    .single();

  const alertSettings: AlertSettings = {
    alert_chat: data?.alert_chat ?? true,
    alert_comment: data?.alert_comment ?? true,
    alert_post: data?.alert_post ?? false,
    interest_categories: data?.interest_categories ?? null,
    alert_keywords: data?.alert_keywords ?? null,
  };

  return (
    <div className="bg-white md:bg-teal-50">
      <div className="max-w-lg md:max-w-5xl mx-auto py-8">
        <ProfileCard
          alertSettings={alertSettings}
          initialIdentities={user.identities ?? []}
        />
      </div>
    </div>
  );
}
