'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { OfferPayload, FIELD_STEP_MAP, REQUIRED_FIELDS, FormFieldError } from '../types';
import { numberToWords } from '../lib/utils';

export type FormData = Record<string, string>;

const DEFAULT_FORM: FormData = {
  orgName: '',
  entityType: 'Company',
  cin: '',
  officeAddress: '',
  signatoryName: '',
  signatoryDesig: '',
  firstAid: 'HR Room',
  salutation: 'Mr.',
  empFullName: '',
  empAddress: '',
  designation: '',
  employeeId: '',
  reportingManager: '',
  attendanceSystem: 'biometric attendance system',
  annualCTC: '',
  offerDate: '',
  offerValidity: '',
  joiningDate: '',
  probationPeriod: '6 (six) months',
  customProbationValue: '',
  customProbationUnit: 'months',
  workDayFrom: 'Monday',
  workDayTo: 'Saturday',
  workStart: '10:30',
  workEnd: '19:30',
  breakDuration: '1 (one) hour',
  monthlyLeave: '1.5 (one and a half) days',
  carryForward: '4 (four) days',
  noticePeriod: '45 (Forty-Five) days',
  abscondDays: '3 (three) consecutive working days',
};

export function useOfferForm() {
  const [formData, setFormData] = useState<FormData>({ ...DEFAULT_FORM });
  const [companyLogo, setCompanyLogo] = useState<string>('');
  const [errors, setErrors] = useState<FormFieldError[]>([]);
  const [currentStep, setCurrentStep] = useState(0);

  const updateField = useCallback((id: string, value: string) => {
    setFormData(prev => ({ ...prev, [id]: value }));
    // Clear error for this field
    setErrors(prev => prev.filter(e => e.id !== id));
  }, []);

  const resetForm = useCallback(() => {
    setFormData({ ...DEFAULT_FORM });
    setCompanyLogo('');
    setErrors([]);
    setCurrentStep(0);
  }, []);

  const loadFromPayload = useCallback((payload: Record<string, unknown>) => {
    const newData = { ...DEFAULT_FORM };
    for (const key of Object.keys(payload)) {
      if (key === 'companyLogo') {
        setCompanyLogo(payload[key] as string || '');
      } else if (key === 'annualCTC') {
        newData[key] = String(payload[key] || '');
      } else if (key in newData) {
        newData[key] = String(payload[key] || '');
      }
    }
    setFormData(newData);
    setErrors([]);
  }, []);

  const getPayload = useCallback((): OfferPayload => {
    const data = { ...formData };
    // Resolve custom probation
    let probation = data.probationPeriod;
    if (probation === 'custom') {
      const n = parseInt(data.customProbationValue) || 0;
      if (n > 0) {
        const words = numberToWords(n);
        probation = `${n} (${words}) ${data.customProbationUnit}`;
      }
    }
    return {
      orgName: data.orgName,
      entityType: data.entityType,
      cin: data.cin,
      signatoryName: data.signatoryName,
      signatoryDesig: data.signatoryDesig,
      officeAddress: data.officeAddress,
      firstAid: data.firstAid,
      companyLogo: companyLogo,
      salutation: data.salutation,
      empFullName: data.empFullName,
      empAddress: data.empAddress,
      designation: data.designation,
      employeeId: data.employeeId,
      reportingManager: data.reportingManager,
      attendanceSystem: data.attendanceSystem,
      annualCTC: parseInt(data.annualCTC) || 0,
      offerDate: data.offerDate,
      offerValidity: data.offerValidity,
      joiningDate: data.joiningDate,
      probationPeriod: probation,
      workDayFrom: data.workDayFrom,
      workDayTo: data.workDayTo,
      workStart: data.workStart,
      workEnd: data.workEnd,
      breakDuration: data.breakDuration,
      monthlyLeave: data.monthlyLeave,
      carryForward: data.carryForward,
      noticePeriod: data.noticePeriod,
      abscondDays: data.abscondDays,
    };
  }, [formData, companyLogo]);

  const validate = useCallback((): FormFieldError[] | null => {
    const errs: FormFieldError[] = [];
    for (const { id, label } of REQUIRED_FIELDS) {
      const val = id === 'annualCTC' ? formData.annualCTC : formData[id];
      if (!val || (id === 'annualCTC' && (parseInt(val) || 0) <= 0)) {
        errs.push({ id, label, message: `${label} is required` });
      }
    }
    // Custom probation validation
    if (formData.probationPeriod === 'custom') {
      const n = parseInt(formData.customProbationValue) || 0;
      if (n < 1) {
        errs.push({ id: 'customProbationValue', label: 'Custom Probation Period', message: 'Enter a valid probation period number' });
      }
    }
    // Cross-field date validation
    if (formData.offerDate && formData.offerValidity && formData.offerDate >= formData.offerValidity) {
      errs.push({ id: 'offerValidity', label: 'Offer Validity Date', message: 'Offer validity must be after the offer date' });
    }
    if (formData.offerDate && formData.joiningDate && formData.offerDate > formData.joiningDate) {
      errs.push({ id: 'joiningDate', label: 'Joining Date', message: 'Joining date must not be before the offer date' });
    }

    if (errs.length === 0) {
      setErrors([]);
      return null;
    }
    setErrors(errs);
    // Navigate to step of first error
    const firstStep = FIELD_STEP_MAP[errs[0].id];
    if (firstStep !== undefined && firstStep !== currentStep) {
      setCurrentStep(firstStep);
    }
    return errs;
  }, [formData, currentStep]);

  return {
    formData,
    companyLogo,
    errors,
    currentStep,
    setCurrentStep,
    updateField,
    setCompanyLogo,
    resetForm,
    loadFromPayload,
    getPayload,
    validate,
    setFormData,
  };
}
