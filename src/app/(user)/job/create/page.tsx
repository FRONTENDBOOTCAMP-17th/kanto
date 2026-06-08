import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { Header } from "@/components/common/Header";
import { Footer } from "@/components/common/Footer";
import { ScrollToTop } from "@/components/common/ScrollToTop";
import { CreateJobForm } from "./_components/CreateJobForm";

export default async function CreateJobPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: dbUser } = await supabase
    .from("users")
    .select("id")
    .eq("auth_id", user.id)
    .single();

  if (!dbUser) redirect("/login");

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <ScrollToTop />
      <CreateJobForm userId={dbUser.id} />
      <Footer />
    </div>
  );
}
