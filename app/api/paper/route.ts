import { NextResponse } from "next/server";
import { extractPdfText } from "@/lib/extract-pdf";
import { PAPER_MAX_BYTES } from "@/lib/paper";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file" }, { status: 400 });
    }
    if (file.size > PAPER_MAX_BYTES) {
      return NextResponse.json({ error: "too_large" }, { status: 413 });
    }
    const name = file.name || "paper.pdf";
    const type = file.type || "";
    if (!name.toLowerCase().endsWith(".pdf") && type !== "application/pdf") {
      return NextResponse.json({ error: "type" }, { status: 415 });
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    const result = await extractPdfText(bytes);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 422 });
    }
    return NextResponse.json({
      excerpt: result.excerpt,
      pages: result.pages,
      fileName: name,
    });
  } catch (error) {
    console.error("Paper extract failed", error);
    return NextResponse.json({ error: "extract" }, { status: 500 });
  }
}
