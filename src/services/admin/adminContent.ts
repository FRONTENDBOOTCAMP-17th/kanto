import { supabaseAdmin } from "@/lib/supabaseAdmin";

export type Scope = "chat" | "post" | "nickname";

export interface ProfanityRule {
  id: number;
  scopes: Scope[];
  words: string[];
  updated_at: string;
  created_at: string;
}

export interface SpamConfig {
  chat_window_sec: number;
  chat_max_count: number;
  chat_cooldown_sec: number;
  max_urls_per_post: number;
  profanity_strike_max: number;
  report_strike_max: number;
  auto_sanction_enabled: boolean;
  updated_at: string;
}

export type SanctionTrigger = "profanity" | "spam" | "report";

export interface SanctionTemplate {
  id: number;
  trigger: SanctionTrigger;
  title: string;
  body: string;
  updated_at: string;
}

export async function getProfanityRules(): Promise<ProfanityRule[]> {
  const { data, error } = await supabaseAdmin
    .from("profanity_rules")
    .select("id, scopes, words, updated_at, created_at")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as ProfanityRule[];
}

export async function createProfanityRule(
  payload: { scopes: Scope[]; words: string[] },
  createdBy: number,
): Promise<ProfanityRule> {
  const { data, error } = await supabaseAdmin
    .from("profanity_rules")
    .insert({ ...payload, created_by: createdBy })
    .select("id, scopes, words, updated_at, created_at")
    .single();
  if (error) throw new Error(error.message);
  return data as ProfanityRule;
}

export async function updateProfanityRule(
  id: number,
  payload: { scopes: Scope[]; words: string[] },
): Promise<ProfanityRule> {
  const { data, error } = await supabaseAdmin
    .from("profanity_rules")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("id, scopes, words, updated_at, created_at")
    .single();
  if (error) throw new Error(error.message);
  return data as ProfanityRule;
}

export async function deleteProfanityRule(id: number): Promise<void> {
  const { error } = await supabaseAdmin
    .from("profanity_rules")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function getSpamConfig(): Promise<SpamConfig> {
  const { data, error } = await supabaseAdmin
    .from("spam_config")
    .select(
      "chat_window_sec, chat_max_count, chat_cooldown_sec, max_urls_per_post, profanity_strike_max, report_strike_max, auto_sanction_enabled, updated_at",
    )
    .eq("id", 1)
    .single();
  if (error) throw new Error(error.message);
  return data as SpamConfig;
}

export async function updateSpamConfig(
  payload: Omit<SpamConfig, "updated_at">,
  updatedBy: number,
): Promise<SpamConfig> {
  const { data, error } = await supabaseAdmin
    .from("spam_config")
    .update({ ...payload, updated_by: updatedBy, updated_at: new Date().toISOString() })
    .eq("id", 1)
    .select(
      "chat_window_sec, chat_max_count, chat_cooldown_sec, max_urls_per_post, profanity_strike_max, report_strike_max, auto_sanction_enabled, updated_at",
    )
    .single();
  if (error) throw new Error(error.message);
  return data as SpamConfig;
}

export interface AffectedPost {
  id: number;
  title: string;
  post_type: string;
  status: string;
  created_at: string;
  matched_in: "title";
}

export async function searchPostsByWords(words: string[]): Promise<AffectedPost[]> {
  if (words.length === 0) return [];

  const titleFilter = words.map((w) => `title.ilike.%${w}%`).join(",");

  const { data: titleMatches, error: titleError } = await supabaseAdmin
    .from("posts")
    .select("id, title, post_type, status, created_at")
    .or(titleFilter)
    .order("created_at", { ascending: false })
    .limit(100);
  if (titleError) throw new Error(titleError.message);

  const results: AffectedPost[] = (titleMatches ?? []).map((p) => ({
    id: p.id,
    title: p.title,
    post_type: p.post_type,
    status: p.status,
    created_at: p.created_at,
    matched_in: "title" as const,
  }));

  return results;
}

export async function getSanctionTemplates(): Promise<SanctionTemplate[]> {
  const { data, error } = await supabaseAdmin
    .from("sanction_templates")
    .select("id, trigger, title, body, updated_at")
    .order("id");
  if (error) throw new Error(error.message);
  return (data ?? []) as SanctionTemplate[];
}

export async function updateSanctionTemplate(
  id: number,
  payload: { title: string; body: string },
  updatedBy: number,
): Promise<SanctionTemplate> {
  const { data, error } = await supabaseAdmin
    .from("sanction_templates")
    .update({ ...payload, updated_by: updatedBy, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("id, trigger, title, body, updated_at")
    .single();
  if (error) throw new Error(error.message);
  return data as SanctionTemplate;
}
