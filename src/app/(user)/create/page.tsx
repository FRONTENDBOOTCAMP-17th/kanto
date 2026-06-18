import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { CreatePageClient } from "./_components/CreatePageClient";

export default async function CreatePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const initialIsVerified = user.user_metadata?.identity_verified === true;

  return <CreatePageClient initialIsVerified={initialIsVerified} />;
}
