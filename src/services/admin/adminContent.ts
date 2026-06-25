import { supabaseAdmin } from "@/lib/supabaseAdmin";

/* ─── 타입 ─────────────────────────────────────────────── */

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

/* ─── 금칙어 룰 ─────────────────────────────────────────── */

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

/* ─── 스팸 설정 ─────────────────────────────────────────── */

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

/* ─── 금칙어 영향 게시물 검색 ───────────────────────────── */

export interface AffectedPost {
  id: number;
  title: string;
  post_type: string;
  status: string;
  created_at: string;
  matched_in: "title" | "content";
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

  const contentFilter = words.map((w) => `content.ilike.%${w}%`).join(",");

  const { data: contentMatches, error: contentError } = await supabaseAdmin
    .from("community_posts")
    .select("post_id, content, post:posts!community_posts_post_id_fkey(id, title, post_type, status, created_at)")
    .or(contentFilter)
    .limit(100);
  if (contentError) throw new Error(contentError.message);

  const titleMatchIds = new Set((titleMatches ?? []).map((p) => p.id));

  const results: AffectedPost[] = (titleMatches ?? []).map((p) => ({
    id: p.id,
    title: p.title,
    post_type: p.post_type,
    status: p.status,
    created_at: p.created_at,
    matched_in: "title" as const,
  }));

  for (const cm of contentMatches ?? []) {
    const post = cm.post?.[0] as {
  id: number;
  title: string;
  post_type: string;
  status: string;
  created_at: string;
} | undefined;
    if (!post || titleMatchIds.has(post.id)) continue;
    results.push({
      id: post.id,
      title: post.title,
      post_type: post.post_type,
      status: post.status,
      created_at: post.created_at,
      matched_in: "content",
    });
  }

  return results;
}

/* ─── 제재 알림 템플릿 ───────────────────────────────────── */

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
