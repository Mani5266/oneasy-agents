// ── Offer Letter Types ──

export interface OfferPayload {
  // Company
  orgName: string;
  entityType: string;
  cin: string;
  signatoryName: string;
  signatoryDesig: string;
  officeAddress: string;
  firstAid: string;
  companyLogo: string;

  // Employee
  salutation: string;
  empFullName: string;
  empAddress: string;
  designation: string;
  employeeId: string;
  reportingManager: string;
  attendanceSystem: string;

  // Dates
  offerDate: string;
  offerValidity: string;
  joiningDate: string;

  // Compensation
  annualCTC: number;

  // Work details
  probationPeriod: string;
  workDayFrom: string;
  workDayTo: string;
  workStart: string;
  workEnd: string;
  breakDuration: string;

  // Leave
  monthlyLeave: string;
  carryForward: string;

  // Termination
  noticePeriod: string;
  abscondDays: string;
}

export interface OfferRecord {
  id: string;
  user_id: string;
  emp_name: string;
  designation: string;
  annual_ctc: number;
  payload: OfferPayload;
  doc_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface SalaryBreakdownRow {
  label: string;
  monthly: number;
  annual: number;
  type: 'earn' | 'total';
}

export interface FormFieldError {
  id: string;
  label: string;
  message: string;
}

export type PageView = 'generator' | 'history';

export interface DraftState {
  currentStep: number;
  currentOfferId: string | null;
  data: Record<string, string>;
  companyLogo?: string;
}

// Form field IDs mapped to step numbers
export const FIELD_STEP_MAP: Record<string, number> = {
  orgName: 0, entityType: 0, cin: 0, officeAddress: 0, signatoryName: 0, signatoryDesig: 0, firstAid: 0,
  salutation: 1, empFullName: 1, empAddress: 1, designation: 1, employeeId: 1, reportingManager: 1, attendanceSystem: 1,
  annualCTC: 2,
  offerDate: 3, offerValidity: 3, joiningDate: 3, probationPeriod: 3, customProbationValue: 3, workDayFrom: 3, workDayTo: 3, workStart: 3, workEnd: 3, breakDuration: 3,
  monthlyLeave: 4, carryForward: 4, noticePeriod: 4, abscondDays: 4,
};

export interface RequiredField {
  id: string;
  label: string;
}

export const REQUIRED_FIELDS: RequiredField[] = [
  { id: 'orgName', label: 'Organization Name' },
  { id: 'officeAddress', label: 'Office Address' },
  { id: 'signatoryName', label: 'Signatory Name' },
  { id: 'signatoryDesig', label: 'Signatory Designation' },
  { id: 'empFullName', label: 'Employee Name' },
  { id: 'designation', label: 'Designation' },
  { id: 'annualCTC', label: 'Annual CTC' },
  { id: 'offerDate', label: 'Offer Date' },
  { id: 'offerValidity', label: 'Offer Validity Date' },
  { id: 'joiningDate', label: 'Joining Date' },
];
