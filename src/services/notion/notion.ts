import { Client } from "@notionhq/client";
import { NotionToMarkdown } from "notion-to-md";

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const n2m = new NotionToMarkdown({ notionClient: notion });

export async function getNotionContent(pageId: string | undefined) {
  if (!pageId) return "현재 내용을 불러올 수 없습니다. 잠시 후 다시 시도해주세요.";
  try {
    const mdBlocks = await n2m.pageToMarkdown(pageId);
    const mdString = n2m.toMarkdownString(mdBlocks);
    return mdString.parent;
  } catch {
    return "현재 내용을 불러올 수 없습니다. 잠시 후 다시 시도해주세요.";
  }
}
