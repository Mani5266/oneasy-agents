/**
 * Builds a standalone HTML document from the certificate preview DOM element.
 * This HTML is sent to the Puppeteer PDF API — it must be fully self-contained
 * with all CSS inlined (no external stylesheets, no Next.js runtime).
 */

const CSS = `
@page {
  size: A4;
  margin: 36pt 0 0 0;
}

* {
  box-sizing: border-box;
}

html, body {
  margin: 0;
  padding: 0;
  height: auto;
  overflow: visible;
}

.print-full {
  display: block;
  margin: 0;
  padding: 0 18mm 12mm 18mm;
  border: none;
  border-radius: 0;
  box-shadow: none;
  background: #fff;
  width: 100%;
  max-width: 100%;
  height: auto;
  overflow: visible;
  font-family: "Times New Roman", Times, serif;
  font-size: 12pt;
  line-height: 1.6;
  color: #000;
}

.print-top-spacer {
  height: 36pt;
  display: block;
}

.print-full p,
.print-full li,
.print-full td,
.print-full th {
  font-family: "Times New Roman", Times, serif;
  color: #000;
}

.print-full p {
  text-align: justify;
}

.print-heading {
  text-align: center !important;
  font-weight: 700;
  text-transform: uppercase;
}

/* Tables */
.print-full table {
  width: 100%;
  border-collapse: collapse;
  page-break-inside: auto;
  margin-bottom: 16pt;
}

.print-full thead {
  display: table-header-group;
}

.print-full tr {
  page-break-inside: avoid;
  break-inside: avoid;
}

.print-full th {
  font-weight: 700;
  background: #fff;
  border: 1px solid #000;
  padding: 5pt 8pt;
  text-align: left;
}

.print-full td {
  border: 1px solid #000;
  padding: 4pt 8pt;
  vertical-align: top;
}

/* Annexure groups */
.print-annexure-group {
  padding-top: 14pt;
  margin-top: 0;
  break-inside: auto;
}

/* ALL paragraphs before the table (heading + italic subtitle) must stay with table */
.print-annexure-group > p {
  break-after: avoid;
  page-break-after: avoid;
}

/* If not enough room for heading + at least a few rows, move whole group to next page */
.print-annexure-group > table {
  break-before: avoid;
  page-break-before: avoid;
}

.print-annexure-break {
  break-before: auto;
  page-break-before: auto;
}

/* Signature block */
.print-signature-block {
  margin-top: 36pt;
  page-break-inside: avoid;
  break-inside: avoid;
  display: block;
}

/* Prevent orphaned headings */
.print-full h1,
.print-full h2,
.print-full h3,
.print-full h4,
.print-full strong {
  page-break-after: avoid;
  break-after: avoid;
}

.print-full ol,
.print-full ul {
  page-break-inside: auto;
}

.print-full li {
  page-break-inside: avoid;
}
`;

/**
 * Takes the innerHTML of the .print-full element and wraps it in a standalone HTML doc.
 */
export function buildCertificateHtml(innerHtml: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>${CSS}</style>
</head>
<body>
<div class="print-full">${innerHtml}</div>
</body>
</html>`;
}
