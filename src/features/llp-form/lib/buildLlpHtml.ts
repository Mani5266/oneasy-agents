/**
 * Wraps LLP deed HTML in a standalone HTML document for Puppeteer PDF generation.
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

.llp-deed {
  display: block;
  margin: 0;
  padding: 0 18mm 12mm 18mm;
  font-family: "Times New Roman", Times, serif;
  font-size: 12pt;
  line-height: 1.7;
  color: #000;
  background: #fff;
}

.llp-deed p {
  margin: 0.5em 0;
  text-align: justify;
}

.llp-deed h1, .llp-deed h2, .llp-deed h3 {
  font-family: "Times New Roman", Times, serif;
  page-break-after: avoid;
}

.llp-deed h1 {
  text-align: center;
  font-size: 16pt;
  text-transform: uppercase;
  font-weight: bold;
  margin-bottom: 0.5em;
}

.llp-deed ul, .llp-deed ol {
  margin: 0.5em 0;
  padding-left: 2em;
  page-break-inside: auto;
}

.llp-deed li {
  margin: 0.3em 0;
  page-break-inside: avoid;
}

.llp-deed table {
  width: 100%;
  border-collapse: collapse;
  margin: 1em 0;
  page-break-inside: auto;
}

.llp-deed th, .llp-deed td {
  border: 1px solid #000;
  padding: 5pt 8pt;
  vertical-align: top;
}

.llp-deed th {
  font-weight: bold;
  background: #fff;
}

.llp-deed thead {
  display: table-header-group;
}

.llp-deed tr {
  page-break-inside: avoid;
}

.llp-deed strong {
  page-break-after: avoid;
}
`;

export function buildLlpHtml(innerHtml: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>${CSS}</style>
</head>
<body>
<div class="llp-deed">${innerHtml}</div>
</body>
</html>`;
}
