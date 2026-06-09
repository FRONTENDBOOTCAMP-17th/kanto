import { Client } from "@notionhq/client";
import { NotionToMarkdown } from "notion-to-md";

const notion = new Client({ auth: process.env.NOTION_API_KEY });
const n2m = new NotionToMarkdown({ notionClient: notion });

export async function getNotionContent() {
  const mdBlocks = await n2m.pageToMarkdown(
    process.env.NOTION_TERMS_SERVICE_PAGE_ID!,
  );
  const mdString = n2m.toMarkdownString(mdBlocks);
  return mdString.parent;
}
