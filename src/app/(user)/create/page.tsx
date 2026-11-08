import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { CreatePageClient } from "./_components/CreatePageClient";
import { ScopedIntlProvider } from "@/i18n/ScopedIntlProvider";

export default async function CreatePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const initialIsVerified = user.user_metadata?.identity_verified === true;

  return (
    <ScopedIntlProvider segment="create">
      <CreatePageClient initialIsVerified={initialIsVerified} />
    </ScopedIntlProvider>
  );
}
