// robots.txt 차단 + proxy에서 403으로 즉시 돌려보낼 AI 학습·수집 / SEO 분석 크롤러 목록.
// Googlebot, Bingbot, Yeti(네이버), Daum 등 일반 검색엔진은 포함하지 않는다.
export const AI_CRAWLER_USER_AGENTS = [
  "GPTBot",
  "ChatGPT-User",
  "OAI-SearchBot",
  "ClaudeBot",
  "Claude-Web",
  "Claude-User",
  "Claude-SearchBot",
  "anthropic-ai",
  "CCBot",
  "Bytespider",
  "Amazonbot",
  "PerplexityBot",
  "Perplexity-User",
  "meta-externalagent",
  "meta-externalfetcher",
  "FacebookBot",
  "Google-Extended",
  "Applebot-Extended",
  "cohere-ai",
  "cohere-training-data-crawler",
  "Diffbot",
  "ImagesiftBot",
  "Omgilibot",
  "Omgili",
  "YouBot",
  "Timpibot",
  "DuckAssistBot",
  "PanguBot",
  "PetalBot",
  "AhrefsBot",
  "SemrushBot",
  "MJ12bot",
  "DotBot",
  "DataForSeoBot",
] as const;

const AI_CRAWLER_PATTERN = new RegExp(
  AI_CRAWLER_USER_AGENTS.map((ua) => ua.replace(/[-]/g, "\\-")).join("|"),
  "i",
);

export function isBlockedCrawler(userAgent: string | null): boolean {
  return !!userAgent && AI_CRAWLER_PATTERN.test(userAgent);
}
