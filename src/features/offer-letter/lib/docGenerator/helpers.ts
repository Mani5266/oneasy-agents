import {
  Paragraph, TextRun, AlignmentType, UnderlineType, PageBreak, BorderStyle,
} from 'docx';
import { C } from './constants';

// Border helpers
export function singleBorder(color = 'auto', sz = 4) {
  return { style: BorderStyle.SINGLE, size: sz, color };
}

export function allBorders(color = 'auto', sz = 4) {
  const b = singleBorder(color, sz);
  return { top: b, bottom: b, left: b, right: b };
}

export function noBorders() {
  const b = { style: BorderStyle.NIL, size: 0, color: 'auto' };
  return { top: b, bottom: b, left: b, right: b };
}

// Run builder
interface RunOpts {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  size?: number;
  font?: string;
  color?: string;
}

export function run(text: string | number, opts: RunOpts = {}): TextRun {
  return new TextRun({
    text: String(text ?? ''),
    bold: opts.bold || false,
    italics: opts.italic || false,
    underline: opts.underline ? { type: UnderlineType.SINGLE } : undefined,
    size: (opts.size || 11) * 2,
    font: opts.font || 'Calibri',
    color: opts.color || C.BLACK,
  });
}

// Paragraph builder
interface ParaOpts extends RunOpts {
  align?: (typeof AlignmentType)[keyof typeof AlignmentType];
  before?: number;
  after?: number;
  indent?: number;
  numbering?: { reference: string; level: number };
}

export function p(children: string | TextRun | (string | TextRun)[], opts: ParaOpts = {}): Paragraph {
  const runs: TextRun[] = [];
  const items = Array.isArray(children) ? children : [children];
  for (const item of items) {
    if (typeof item === 'string') {
      runs.push(run(item, opts));
    } else {
      runs.push(item);
    }
  }
  return new Paragraph({
    alignment: opts.align || AlignmentType.LEFT,
    spacing: { before: opts.before ?? 80, after: opts.after ?? 80 },
    indent: opts.indent ? { left: opts.indent } : undefined,
    numbering: opts.numbering || undefined,
    children: runs,
  });
}

export function blank(n = 1): Paragraph[] {
  return Array.from({ length: n }, () => new Paragraph({ children: [new TextRun('')] }));
}

export function pageBreak(): Paragraph {
  return new Paragraph({ children: [new PageBreak()] });
}

export function docTitle(text: string): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 200, after: 200 },
    children: [run(text, { bold: true, size: 14, underline: true })],
  });
}

export function labelValue(label: string, value: string, opts: { before?: number; after?: number } = {}): Paragraph {
  return p([
    run(label, { bold: true, size: 11 }),
    run(value, { size: 11 }),
  ], { before: opts.before ?? 80, after: opts.after ?? 80 });
}

export function clauseHead(num: number, title: string): Paragraph {
  return p([
    run(`${num}.  `, { bold: true, size: 11 }),
    run(title, { bold: true, size: 11 }),
  ], { before: 160, after: 60 });
}

export function subClause(num: string, runs_or_text: string | TextRun[]): Paragraph {
  const children = typeof runs_or_text === 'string'
    ? [run(`${num}  `, { size: 11 }), run(runs_or_text, { size: 11 })]
    : [run(`${num}  `, { size: 11 }), ...runs_or_text];
  return new Paragraph({
    spacing: { before: 40, after: 40 },
    indent: { left: 360 },
    children,
  });
}

export function body(runs_or_text: string | TextRun[], opts: ParaOpts = {}): Paragraph {
  const children = typeof runs_or_text === 'string'
    ? [run(runs_or_text, { size: 11, bold: opts.bold })]
    : runs_or_text;
  return new Paragraph({
    alignment: opts.align || AlignmentType.LEFT,
    spacing: { before: opts.before ?? 80, after: opts.after ?? 80 },
    indent: opts.indent ? { left: opts.indent } : undefined,
    children,
  });
}
