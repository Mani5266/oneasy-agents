import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

export const maxDuration = 60; // Allow up to 60s for PDF generation

export async function POST(req: NextRequest) {
  try {
    const { html, candidateName } = await req.json();

    if (!html || typeof html !== "string") {
      return NextResponse.json({ error: "Missing html body" }, { status: 400 });
    }

    const safeName = (candidateName || "").replace(/[^a-zA-Z0-9_\- ]/g, "").trim().replace(/\s+/g, "_");
    const filename = safeName
      ? `Networth_Certificate_${safeName}.pdf`
      : "Networth_Certificate.pdf";

    // Launch browser — uses @sparticuz/chromium in production (Vercel),
    // falls back to local Chrome in development
    const isLocal = process.env.NODE_ENV === "development";

    const browser = await puppeteer.launch({
      args: isLocal ? [] : chromium.args,
      defaultViewport: { width: 1200, height: 800 },
      executablePath: isLocal
        ? getLocalChromePath()
        : await chromium.executablePath(),
      headless: true,
    });

    const page = await browser.newPage();

    // Set the full HTML content with embedded styles
    await page.setContent(html, { waitUntil: "domcontentloaded" });

    // Generate PDF with NO browser headers/footers
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      displayHeaderFooter: false,
      margin: {
        top: "0.5in",
        right: "0mm",
        bottom: "0mm",
        left: "0mm",
      },
      preferCSSPageSize: true,
    });

    await browser.close();

    return new NextResponse(Buffer.from(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: unknown) {
    console.error("[generate-pdf] Error:", error);
    return NextResponse.json(
      { error: "PDF generation failed", details: String(error) },
      { status: 500 }
    );
  }
}

/** Find local Chrome/Chromium on different OS */
function getLocalChromePath(): string {
  const paths: Record<string, string[]> = {
    win32: [
      "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
      process.env.LOCALAPPDATA + "\\Google\\Chrome\\Application\\chrome.exe",
    ],
    darwin: [
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    ],
    linux: [
      "/usr/bin/google-chrome",
      "/usr/bin/chromium-browser",
      "/usr/bin/chromium",
    ],
  };

  const platform = process.platform;
  const candidates = paths[platform] || paths.linux;

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require("fs");
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }

  // Fallback — let puppeteer figure it out
  return candidates[0];
}
