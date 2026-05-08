// ── FormField Component ──────────────────────────────────────────────────────

'use client';

import React from 'react';
import { useWizardStore } from '../hooks/useWizardStore';

interface FormFieldProps {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  type?: 'text' | 'number' | 'date' | 'email' | 'password' | 'tel';
  as?: 'input' | 'select' | 'textarea';
  value: string | number;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  disabled?: boolean;
  min?: number | string;
  max?: number | string;
  step?: number | string;
  rows?: number;
  children?: React.ReactNode;
  className?: string;
  fullWidth?: boolean;
  autoFocus?: boolean;
  suffix?: React.ReactNode;
  extra?: React.ReactNode;
}

export function FormField({
  id,
  label,
  required,
  hint,
  type = 'text',
  as = 'input',
  value,
  onChange,
  onBlur,
  placeholder,
  disabled,
  min,
  max,
  step,
  rows = 3,
  children,
  className = '',
  fullWidth = false,
  autoFocus,
  suffix,
  extra,
}: FormFieldProps) {
  const fieldError = useWizardStore((s) => s.fieldErrors[id]);
  const clearFieldError = useWizardStore((s) => s.clearFieldError);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    onChange(e.target.value);
    if (fieldError) clearFieldError(id);
  };

  const fieldClasses = [
    'field',
    fieldError ? 'error' : '',
    fullWidth ? 'full-width' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={fieldClasses}>
      <label htmlFor={id}>
        {label}
        {required && <span className="req">*</span>}
      </label>

      <div style={{ position: 'relative' }}>
        {as === 'textarea' ? (
          <textarea
            id={id}
            value={value}
            onChange={handleChange}
            onBlur={onBlur}
            placeholder={placeholder}
            disabled={disabled}
            rows={rows}
            autoFocus={autoFocus}
          />
        ) : as === 'select' ? (
          <select
            id={id}
            value={value}
            onChange={handleChange}
            onBlur={onBlur}
            disabled={disabled}
            autoFocus={autoFocus}
          >
            {children}
          </select>
        ) : (
          <input
            id={id}
            type={type}
            value={value}
            onChange={handleChange}
            onBlur={onBlur}
            placeholder={placeholder}
            disabled={disabled}
            min={min}
            max={max}
            step={step}
            autoFocus={autoFocus}
          />
        )}

        {suffix && (
          <span style={{
            position: 'absolute',
            right: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: 'var(--text-xs)',
            color: 'var(--text-light)',
            pointerEvents: 'none',
          }}>
            {suffix}
          </span>
        )}
      </div>

      {extra}

      {fieldError && (
        <p className="field-error-msg">{fieldError}</p>
      )}

      {hint && !fieldError && (
        <p className="field-hint">{hint}</p>
      )}
    </div>
  );
}
