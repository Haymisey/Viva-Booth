import { extractText } from "unpdf";
import { PAPER_MAX_PAGES, clipExcerpt } from "./paper";

export async function extractPdfText(bytes: Uint8Array) {
  const { totalPages, text } = await extractText(bytes, { mergePages: true });
  if (totalPages > PAPER_MAX_PAGES) {
    return { ok: false as const, error: "pages" as const };
  }
  const excerpt = clipExcerpt(text);
  if (!excerpt) return { ok: false as const, error: "empty" as const };
  return { ok: true as const, excerpt, pages: totalPages };
}
