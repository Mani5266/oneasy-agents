import { NextRequest, NextResponse } from "next/server";
import { generatePdfFromHtml, resetBrowser } from "@/lib/puppeteer";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { html, llpName } = await req.json();

    if (!html || typeof html !== "string") {
      return NextResponse.json({ error: "Missing html body" }, { status: 400 });
    }

    const safeName = (llpName || "").replace(/[^a-zA-Z0-9_\- ]/g, "").trim();
    const filename = safeName
      ? `LLP_Agreement - ${safeName}.pdf`
      : "LLP_Agreement.pdf";

    const pdfBuffer = await generatePdfFromHtml(html);

    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: unknown) {
    resetBrowser();
    console.error("[llp-form/generate-pdf] Error:", error);
    return NextResponse.json(
      { error: "PDF generation failed", details: String(error) },
      { status: 500 }
    );
  }
}
