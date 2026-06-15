import { Client, isFullPage } from "@notionhq/client";
import { NotionToMarkdown } from "notion-to-md";

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const n2m = new NotionToMarkdown({ notionClient: notion });

const devCache = new Map<string, string>();
const devPageCache = new Map<string, { title: string; content: string }>();

export async function getNotionContent(pageId: string | undefined) {
  if (!pageId) return "현재 내용을 불러올 수 없습니다. 잠시 후 다시 시도해주세요.";

  if (process.env.NODE_ENV === "development" && devCache.has(pageId)) {
    return devCache.get(pageId)!;
  }

  try {
    const mdBlocks = await n2m.pageToMarkdown(pageId);
    const content = n2m.toMarkdownString(mdBlocks).parent;

    if (process.env.NODE_ENV === "development") {
      devCache.set(pageId, content);
    }

    return content;
  } catch {
    return "현재 내용을 불러올 수 없습니다. 잠시 후 다시 시도해주세요.";
  }
}

export async function getNotionPage(pageId: string | undefined) {
  if (!pageId) return { title: "", content: "현재 내용을 불러올 수 없습니다. 잠시 후 다시 시도해주세요." };

  if (process.env.NODE_ENV === "development" && devPageCache.has(pageId)) {
    return devPageCache.get(pageId)!;
  }

  try {
    const [page, mdBlocks] = await Promise.all([
      notion.pages.retrieve({ page_id: pageId }),
      n2m.pageToMarkdown(pageId),
    ]);

    let title = "";
    if (isFullPage(page)) {
      const titleProp = page.properties.title;
      if (titleProp.type === "title") {
        title = titleProp.title[0]?.plain_text ?? "";
      }
    }

    const content = n2m.toMarkdownString(mdBlocks).parent;
    const result = { title, content };

    if (process.env.NODE_ENV === "development") {
      devPageCache.set(pageId, result);
    }

    return result;
  } catch {
    return { title: "", content: "현재 내용을 불러올 수 없습니다. 잠시 후 다시 시도해주세요." };
  }
}
