import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { Header } from "@/components/common/Header";
import { Footer } from "@/components/common/Footer";
import { ScrollToTop } from "@/components/common/ScrollToTop";
import { CreateUsedGoodsForm } from "./_components/CreateUsedGoodsForm";

export default async function CreateUsedGoodsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <ScrollToTop />
      <CreateUsedGoodsForm />
      <Footer />
    </div>
  );
}
