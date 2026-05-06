import { AlignmentType, BorderStyle, LevelFormat } from 'docx';

// Page constants (A4)
export const PAGE_W = 11906;
export const PAGE_H = 16838;
export const MAR_TOP = 1440;
export const MAR_BOT = 1440;
export const MAR_LEFT = 1440;
export const MAR_RIGHT = 1700;
export const CONTENT_W = 8766; // PAGE_W - MAR_LEFT - MAR_RIGHT

export const C = {
  BLACK: '000000',
  NAVY: '1F3864',
  GRAY: '595959',
  LGRAY: 'D9D9D9',
  WHITE: 'FFFFFF',
};

export const NUMBERING = {
  config: [
    {
      reference: 'alpha-lower',
      levels: [{
        level: 0,
        format: LevelFormat.LOWER_LETTER,
        text: '%1.',
        alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } },
      }],
    },
  ],
};

export const SALARY_PERCENTAGES = {
  BASIC: 0.50,
  HRA: 0.188,
  CONVEYANCE: 0.047,
  MEDICAL: 0.0282,
  CHILDREN_EDU: 0.0094,
  CHILDREN_HOST: 0.0094,
  SPECIAL: 0.047,
  LTA: 0.047,
  EMPLOYER_PF_OF_BASIC: 0.12,
};
