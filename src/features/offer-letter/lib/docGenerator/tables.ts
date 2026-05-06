import {
  Table, TableRow, TableCell, Paragraph, WidthType, BorderStyle,
  ShadingType, AlignmentType,
} from 'docx';
import { CONTENT_W, C } from './constants';
import { noBorders, allBorders, run } from './helpers';
import { formatINR } from './numberUtils';
import type { SalaryBreakdownRow } from '../../types';

export function sigTable(leftLines: string[], rightLines: string[]): Table {
  function col(lines: string[], w: number): TableCell {
    return new TableCell({
      borders: noBorders(),
      width: { size: w, type: WidthType.DXA },
      margins: { top: 60, bottom: 60, left: 0, right: 0 },
      children: lines.map(l =>
        new Paragraph({ spacing: { before: 40, after: 40 }, children: [run(l, { size: 11 })] })
      ),
    });
  }
  const half = Math.floor(CONTENT_W / 2);
  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: [half, CONTENT_W - half],
    borders: noBorders(),
    rows: [new TableRow({ children: [col(leftLines, half), col(rightLines, CONTENT_W - half)] })],
  });
}

export function salaryTable(breakdown: SalaryBreakdownRow[]): Table {
  const col1 = Math.floor(CONTENT_W * 0.5);
  const col2 = Math.floor(CONTENT_W * 0.25);
  const col3 = CONTENT_W - col1 - col2;

  function hdrCell(text: string, w: number): TableCell {
    return new TableCell({
      borders: allBorders('auto', 4),
      shading: { fill: '1F3864', type: ShadingType.CLEAR },
      width: { size: w, type: WidthType.DXA },
      margins: { top: 60, bottom: 60, left: 100, right: 100 },
      children: [new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [run(text, { bold: true, size: 10, color: C.WHITE })],
      })],
    });
  }

  function dataCell(text: string, w: number, bold = false, bg = C.WHITE): TableCell {
    return new TableCell({
      borders: allBorders('auto', 4),
      shading: { fill: bg, type: ShadingType.CLEAR },
      width: { size: w, type: WidthType.DXA },
      margins: { top: 40, bottom: 40, left: 100, right: 100 },
      children: [new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [run(text, { bold, size: 10 })],
      })],
    });
  }

  function labelCell(text: string, w: number, bold = false, bg = C.WHITE): TableCell {
    return new TableCell({
      borders: allBorders('auto', 4),
      shading: { fill: bg, type: ShadingType.CLEAR },
      width: { size: w, type: WidthType.DXA },
      margins: { top: 40, bottom: 40, left: 100, right: 100 },
      children: [new Paragraph({
        children: [run(text, { bold, size: 10 })],
      })],
    });
  }

  const rows = [
    new TableRow({
      children: [
        hdrCell('Description', col1),
        hdrCell('Monthly (Rs. Per Month)', col2),
        hdrCell('Annual (Rs. Per Annum)', col3),
      ],
    }),
  ];

  for (const row of breakdown) {
    const isTotal = row.type === 'total';
    const bg = isTotal ? 'D9D9D9' : C.WHITE;
    rows.push(new TableRow({
      children: [
        labelCell(row.label, col1, isTotal, bg),
        dataCell(formatINR(row.monthly), col2, isTotal, bg),
        dataCell(formatINR(row.annual), col3, isTotal, bg),
      ],
    }));
  }

  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: [col1, col2, col3],
    rows,
  });
}
