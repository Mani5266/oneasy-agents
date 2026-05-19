import puppeteer, { Browser } from "puppeteer-core";
import chromium from "@sparticuz/chromium";

// ── Shared browser singleton — reused across all PDF generation routes ───────
let browserInstance: Browser | null = null;
let browserLaunchPromise: Promise<Browser> | null = null;

export async function getBrowser(): Promise<Browser> {
  if (browserInstance && browserInstance.connected) {
    return browserInstance;
  }

  if (browserLaunchPromise) {
    return browserLaunchPromise;
  }

  const isLocal = process.env.NODE_ENV === "development";

  browserLaunchPromise = puppeteer.launch({
    args: isLocal
      ? ["--no-sandbox", "--disable-setuid-sandbox"]
      : [...chromium.args, "--no-sandbox", "--disable-setuid-sandbox"],
    defaultViewport: { width: 794, height: 1123 },
    executablePath: isLocal
      ? getLocalChromePath()
      : await chromium.executablePath(),
    headless: true,
  }).catch((err) => {
    browserLaunchPromise = null;
    browserInstance = null;
    throw err;
  });

  browserInstance = await browserLaunchPromise;
  browserLaunchPromise = null;
  return browserInstance;
}

export function resetBrowser() {
  browserInstance = null;
  browserLaunchPromise = null;
}

/** Generate a PDF buffer from standalone HTML string */
export async function generatePdfFromHtml(html: string): Promise<Buffer> {
  const browser = await getBrowser();
  let page;

  try {
    page = await browser.newPage();
    await page.setContent(html, { waitUntil: "domcontentloaded" });

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

    return Buffer.from(pdfBuffer);
  } catch (err) {
    // If browser disconnected mid-generation, reset for next call
    if (!browser.connected) {
      resetBrowser();
    }
    throw err;
  } finally {
    if (page) {
      try { await page.close(); } catch { /* page may already be closed */ }
    }
  }
}

/** Find local Chrome/Chromium */
function getLocalChromePath(): string {
  const paths: Record<string, string[]> = {
    win32: [
      "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
      "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
      (process.env.LOCALAPPDATA || "") + "\\Google\\Chrome\\Application\\chrome.exe",
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

  return candidates[0];
}
