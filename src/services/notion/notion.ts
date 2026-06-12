import { Client } from "@notionhq/client";
import { NotionToMarkdown } from "notion-to-md";

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const n2m = new NotionToMarkdown({ notionClient: notion });

const devCache = new Map<string, string>();

export async function getNotionContent(pageId: string | undefined) {
  if (!pageId) return "현재 내용을 불러올 수 없습니다. 잠시 후 다시 시도해주세요.";

  if (process.env.NODE_ENV === "development" && devCache.has(pageId)) {
    return devCache.get(pageId)!;
  }

  try {
    const mdBlocks = await n2m.pageToMarkdown(pageId);
    const mdString = n2m.toMarkdownString(mdBlocks);
    const content = mdString.parent;

    if (process.env.NODE_ENV === "development") {
      devCache.set(pageId, content);
    }

    return content;
  } catch {
    return "현재 내용을 불러올 수 없습니다. 잠시 후 다시 시도해주세요.";
  }
}
