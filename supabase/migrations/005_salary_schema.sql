-- ══════════════════════════════════════════════════════════════════════════════
-- 005: Salary Agent Schema
-- ══════════════════════════════════════════════════════════════════════════════

-- Table: salary_results
CREATE TABLE IF NOT EXISTS salary_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  annual_ctc NUMERIC NOT NULL DEFAULT 0,
  monthly_ctc NUMERIC NOT NULL DEFAULT 0,
  state TEXT,
  basic NUMERIC DEFAULT 0,
  hra NUMERIC DEFAULT 0,
  conveyance NUMERIC DEFAULT 0,
  medical NUMERIC DEFAULT 0,
  children_education NUMERIC DEFAULT 0,
  children_hostel NUMERIC DEFAULT 0,
  special_allowance NUMERIC DEFAULT 0,
  lta NUMERIC DEFAULT 0,
  differential_allowance NUMERIC DEFAULT 0,
  total_earnings NUMERIC DEFAULT 0,
  employee_epf NUMERIC DEFAULT 0,
  employee_esi NUMERIC DEFAULT 0,
  professional_tax NUMERIC DEFAULT 0,
  total_deductions NUMERIC DEFAULT 0,
  employer_epf NUMERIC DEFAULT 0,
  employer_esi NUMERIC DEFAULT 0,
  net_salary_monthly NUMERIC DEFAULT 0,
  net_salary_annual NUMERIC DEFAULT 0,
  esi_eligible BOOLEAN DEFAULT false,
  employee_name TEXT,
  calculation_type TEXT DEFAULT 'standard',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table: salary_payslips
CREATE TABLE IF NOT EXISTS salary_payslips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_name TEXT NOT NULL DEFAULT '',
  company_name TEXT DEFAULT '',
  month TEXT NOT NULL,
  annual_ctc NUMERIC NOT NULL DEFAULT 0,
  net_salary NUMERIC NOT NULL DEFAULT 0,
  file_name TEXT NOT NULL,
  pdf_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE salary_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_payslips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own salary results"
  ON salary_results FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own payslips"
  ON salary_payslips FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('salary-payslips', 'salary-payslips', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users upload own payslips"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'salary-payslips' AND auth.uid() IS NOT NULL);

CREATE POLICY "Public read payslips"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'salary-payslips');

-- Table: salary_employees
CREATE TABLE IF NOT EXISTS salary_employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  employee_code TEXT,
  designation TEXT,
  department TEXT,
  date_of_joining TEXT,
  annual_ctc NUMERIC NOT NULL DEFAULT 0,
  state TEXT DEFAULT 'Karnataka',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE salary_employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own employees"
  ON salary_employees FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
