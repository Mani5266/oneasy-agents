import { z } from 'zod';

export const generatePayloadSchema = z.object({
  _offerId: z.string().uuid().optional(),

  // Company details
  orgName: z.string().min(1, 'Organization name is required').max(200),
  entityType: z.string().max(50).optional().default('Company'),
  cin: z.string().max(100).optional().default(''),
  signatoryName: z.string().min(1, 'Signatory name is required').max(200),
  signatoryDesig: z.string().min(1, 'Signatory designation is required').max(200),
  officeAddress: z.string().min(1, 'Office address is required').max(500),
  firstAid: z.string().max(200).optional().default(''),

  companyLogo: z.string().max(750000).optional().default(''),

  // Employee details
  salutation: z.string().max(20).optional().default('Mr.'),
  empFullName: z.string().min(1, 'Employee name is required').max(200),
  empAddress: z.string().max(500).optional().default(''),
  designation: z.string().min(1, 'Designation is required').max(200),
  employeeId: z.string().max(100).optional().default(''),
  reportingManager: z.string().max(200).optional().default(''),
  attendanceSystem: z.string().max(100).optional().default('biometric attendance system'),

  // Dates
  offerDate: z.string().min(1, 'Offer date is required').max(50),
  offerValidity: z.string().min(1, 'Offer validity date is required').max(50),
  joiningDate: z.string().min(1, 'Joining date is required').max(50),

  // Compensation
  annualCTC: z.union([z.number(), z.string()]).transform(val => {
    const num = typeof val === 'string' ? Number(val) : val;
    if (isNaN(num) || num < 0) return 0;
    return Math.round(num);
  }).refine(val => val > 0, { message: 'Annual CTC must be greater than zero' }),

  // Work details
  probationPeriod: z.string().max(100).optional().default(''),
  workDayFrom: z.string().max(20).optional().default(''),
  workDayTo: z.string().max(20).optional().default(''),
  workStart: z.string().max(20).optional().default(''),
  workEnd: z.string().max(20).optional().default(''),
  breakDuration: z.string().max(100).optional().default(''),

  // Leave details
  monthlyLeave: z.string().max(100).optional().default(''),
  carryForward: z.string().max(100).optional().default(''),

  // Termination
  noticePeriod: z.string().max(100).optional().default(''),
  abscondDays: z.string().max(100).optional().default(''),
}).strip()
  .superRefine((data, ctx) => {
    if (data.offerDate && data.offerValidity && data.offerDate >= data.offerValidity) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['offerValidity'],
        message: 'Offer validity must be after the offer date',
      });
    }
    if (data.offerDate && data.joiningDate && data.offerDate > data.joiningDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['joiningDate'],
        message: 'Joining date must not be before the offer date',
      });
    }
  });

export function validateGeneratePayload(body: unknown) {
  try {
    const result = generatePayloadSchema.safeParse(body);
    if (result.success) {
      return { success: true as const, data: result.data };
    }
    const errors = result.error.issues.map(
      issue => `${issue.path.join('.')}: ${issue.message}`
    );
    return { success: false as const, errors };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false as const, errors: ['Validation failed: ' + message] };
  }
}
