// ── SIGNATURE TABLE ─────────────────────────────────────────────────────────

import {
  Table,
  TableRow,
  TableCell,
  Paragraph,
  WidthType,
  BorderStyle,
} from 'docx';
import { CONTENT_W } from './constants';
import { noBorders, run } from './helpers';

export function sigTable(
  leftLines: string[],
  rightLines: string[]
): Table {
  function col(lines: string[], w: number): TableCell {
    return new TableCell({
      borders: noBorders(),
      width: { size: w, type: WidthType.DXA },
      margins: { top: 60, bottom: 60, left: 0, right: 0 },
      children: lines.map(
        (l) =>
          new Paragraph({
            spacing: { before: 40, after: 40 },
            children: [run(l, { size: 11 })],
          })
      ),
    });
  }

  const half = Math.floor(CONTENT_W / 2);

  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: [half, CONTENT_W - half],
    borders: {
      ...noBorders(),
      insideHorizontal: { style: BorderStyle.NIL, size: 0, color: 'auto' },
      insideVertical: { style: BorderStyle.NIL, size: 0, color: 'auto' },
    },
    rows: [
      new TableRow({
        children: [col(leftLines, half), col(rightLines, CONTENT_W - half)],
      }),
    ],
  });
}
