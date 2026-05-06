// ── PAGE CONSTANTS (A4 dimensions in DXA) ───────────────────────────────────

export const PAGE_W = 11906;
export const PAGE_H = 16838;
export const MAR_TOP = 1440;
export const MAR_BOT = 1440;
export const MAR_LEFT = 1440;
export const MAR_RIGHT = 1440;
export const CONTENT_W = PAGE_W - MAR_LEFT - MAR_RIGHT; // 9026

export const C = {
  BLACK: '000000',
  NAVY: '1F3864',
  GRAY: '595959',
  LGRAY: 'D9D9D9',
  WHITE: 'FFFFFF',
} as const;
