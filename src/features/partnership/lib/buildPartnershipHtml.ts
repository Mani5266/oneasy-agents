/**
 * Wraps partnership deed innerHTML in a standalone HTML document for Puppeteer PDF.
 */

const CSS = `
@page {
  size: A4;
  margin: 0.5in 0 0 0;
}

* { box-sizing: border-box; }

html, body {
  margin: 0;
  padding: 0;
  height: auto;
  overflow: visible;
}

.print-content {
  display: block;
  margin: 0;
  padding: 0 18mm 12mm 18mm;
  font-family: "Times New Roman", Times, serif;
  font-size: 12pt;
  line-height: 1.7;
  color: #000;
  background: #fff;
}

.print-content p {
  margin: 0.5em 0;
  text-align: justify;
}

.print-content h1 {
  text-align: center;
  font-size: 16pt;
  text-decoration: underline;
  text-transform: uppercase;
  font-weight: bold;
  margin-bottom: 0.5em;
  font-family: "Times New Roman", Times, serif;
}

.print-content ul, .print-content ol {
  margin: 0.5em 0;
  padding-left: 2em;
  page-break-inside: auto;
}

.print-content li {
  margin: 0.3em 0;
  page-break-inside: avoid;
}

.print-content table {
  width: 100%;
  margin-top: 2em;
  page-break-inside: avoid;
}

.print-content strong {
  page-break-after: avoid;
}
`;

export function buildPartnershipHtml(innerHtml: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>${CSS}</style>
</head>
<body>
<div class="print-content">${innerHtml}</div>
</body>
</html>`;
}
