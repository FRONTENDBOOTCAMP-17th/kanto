import { supabase } from "@/lib/supabase";
import type { SignupAgreements } from "../_components/AgreeSection";

interface SignUpUserParams {
  name: string;
  email: string;
  password: string;
  agreements: SignupAgreements;
}

export type SignUpResult =
  | { status: "success" }
  | { status: "error"; code: "email_exists" | "unknown" };

type SignUpResponse = Awaited<ReturnType<typeof supabase.auth.signUp>>;

function isEmailAlreadyRegistered({ data, error }: SignUpResponse): boolean {
  if (error) return error.code === "user_already_exists";
  return data.user?.identities?.length === 0;
}

export async function signUpUser({
  name,
  email,
  password,
  agreements,
}: SignUpUserParams): Promise<SignUpResult> {
  const response = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        terms_agreed: agreements.terms,
        privacy_agreed: agreements.privacy,
        age_confirmed: agreements.age,
        marketing_consent: agreements.marketing,
        push_consent: agreements.push,
        agreements_updated_at: new Date().toISOString(),
      },
    },
  });

  if (isEmailAlreadyRegistered(response)) {
    return { status: "error", code: "email_exists" };
  }

  if (response.error) {
    return { status: "error", code: "unknown" };
  }

  return { status: "success" };
}
