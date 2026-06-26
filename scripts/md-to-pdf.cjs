// Generates PROJECT_OVERVIEW.pdf from PROJECT_OVERVIEW.md
// Uses puppeteer-core (already a project dep) + Chrome installed at ~/.cache/puppeteer
// Markdown -> HTML happens inside the headless page via marked.js from CDN.

const fs = require('fs');
const path = require('path');
const os = require('os');
const puppeteer = require('puppeteer-core');

async function findChrome() {
  const cacheBase = path.join(os.homedir(), '.cache', 'puppeteer', 'chrome');
  if (!fs.existsSync(cacheBase)) throw new Error('No Chrome cache found at ' + cacheBase);
  const versions = fs.readdirSync(cacheBase).filter((d) => d.startsWith('win64-'));
  if (versions.length === 0) throw new Error('No Chrome version installed in ' + cacheBase);
  versions.sort().reverse();
  const exe = path.join(cacheBase, versions[0], 'chrome-win64', 'chrome.exe');
  if (!fs.existsSync(exe)) throw new Error('Chrome exe not found at ' + exe);
  return exe;
}

async function main() {
  const inputMd = path.resolve(__dirname, '..', 'PROJECT_OVERVIEW.md');
  const outputPdf = path.resolve(__dirname, '..', 'PROJECT_OVERVIEW.pdf');
  const md = fs.readFileSync(inputMd, 'utf8');

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>OnEasy Agents — Project Overview</title>
<script src="https://cdn.jsdelivr.net/npm/marked@12.0.0/marked.min.js"></script>
<style>
  @page { size: A4; margin: 18mm 16mm; }
  :root {
    --navy: #0A2640;
    --red: #C80009;
    --ink: #18222F;
    --muted: #5C6877;
    --border: #E2E8F0;
    --bg-soft: #F7F9FC;
    --code-bg: #F3F4F6;
  }
  * { box-sizing: border-box; }
  html, body {
    font-family: 'Inter', 'Segoe UI', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
    color: var(--ink);
    line-height: 1.6;
    font-size: 10.5pt;
    background: #fff;
    margin: 0;
  }
  #content {
    max-width: 100%;
  }
  h1, h2, h3, h4 {
    font-weight: 700;
    color: var(--navy);
    line-height: 1.25;
    margin-top: 1.4em;
    margin-bottom: 0.5em;
    page-break-after: avoid;
  }
  h1 {
    font-size: 26pt;
    border-bottom: 3px solid var(--red);
    padding-bottom: 8px;
    margin-top: 0;
  }
  h2 {
    font-size: 16pt;
    margin-top: 1.6em;
    border-bottom: 1px solid var(--border);
    padding-bottom: 4px;
  }
  h3 { font-size: 12.5pt; color: var(--ink); }
  p { margin: 0.6em 0; }
  blockquote {
    border-left: 3px solid var(--red);
    padding: 4px 14px;
    color: var(--muted);
    margin: 0.8em 0;
    background: var(--bg-soft);
    border-radius: 0 4px 4px 0;
    font-style: italic;
  }
  ul, ol { padding-left: 22px; margin: 0.6em 0; }
  li { margin: 0.25em 0; }
  hr {
    border: 0;
    border-top: 1px solid var(--border);
    margin: 1.4em 0;
  }
  a { color: var(--red); text-decoration: none; }
  a:hover { text-decoration: underline; }
  strong { color: var(--navy); }
  code {
    font-family: 'JetBrains Mono', 'Consolas', 'Courier New', monospace;
    background: var(--code-bg);
    padding: 1px 5px;
    border-radius: 3px;
    font-size: 9.5pt;
    color: var(--red);
  }
  pre {
    background: var(--bg-soft);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 12px 14px;
    font-size: 9.5pt;
    line-height: 1.5;
    overflow-x: auto;
    page-break-inside: avoid;
  }
  pre code {
    background: transparent;
    color: var(--ink);
    padding: 0;
    font-size: 9.5pt;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 0.8em 0;
    font-size: 10pt;
    page-break-inside: avoid;
  }
  th {
    background: var(--navy);
    color: #fff;
    text-align: left;
    padding: 8px 10px;
    font-weight: 600;
    border: 1px solid var(--navy);
  }
  td {
    padding: 7px 10px;
    border: 1px solid var(--border);
    vertical-align: top;
  }
  tbody tr:nth-child(even) { background: var(--bg-soft); }
  tbody tr td:first-child { font-weight: 500; color: var(--navy); }
</style>
</head>
<body>
  <div id="content"></div>
  <script>
    const md = ${JSON.stringify(md)};
    document.getElementById('content').innerHTML = marked.parse(md);
    window.__rendered = true;
  </script>
</body>
</html>`;

  const tmpHtml = path.join(os.tmpdir(), 'oneasy-overview-' + Date.now() + '.html');
  fs.writeFileSync(tmpHtml, html, 'utf8');

  const executablePath = await findChrome();
  console.log('Using Chrome:', executablePath);

  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.goto('file:///' + tmpHtml.replace(/\\/g, '/'), { waitUntil: 'networkidle0' });
    await page.waitForFunction('window.__rendered === true', { timeout: 15000 });

    await page.pdf({
      path: outputPdf,
      format: 'A4',
      printBackground: true,
      margin: { top: '18mm', right: '16mm', bottom: '20mm', left: '16mm' },
      displayHeaderFooter: true,
      headerTemplate: '<div></div>',
      footerTemplate:
        '<div style="font-size:8pt;color:#5C6877;width:100%;text-align:center;padding:0 16mm;">' +
        'OnEasy Agents — Project Overview &nbsp;|&nbsp; Page <span class="pageNumber"></span> of <span class="totalPages"></span>' +
        '</div>',
    });
    console.log('PDF written to:', outputPdf);
  } finally {
    await browser.close();
    try { fs.unlinkSync(tmpHtml); } catch {}
  }
}

main().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});
