import { supabase } from "@/lib/supabase";
import type { UserIdentity } from "@supabase/supabase-js";

export async function linkSocialIdentity(provider: "google" | "kakao" | "facebook", redirectTo: string) {
  return supabase.auth.linkIdentity({ provider, options: { redirectTo } });
}

export async function unlinkSocialIdentity(identity: UserIdentity) {
  return supabase.auth.unlinkIdentity(identity);
}
