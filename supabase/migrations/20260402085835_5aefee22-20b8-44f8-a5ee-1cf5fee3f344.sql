
-- ============================================================
-- SEQUENCES for number generation
-- ============================================================
CREATE SEQUENCE IF NOT EXISTS deviation_number_seq START 1;
CREATE SEQUENCE IF NOT EXISTS audit_number_seq START 1;
CREATE SEQUENCE IF NOT EXISTS change_number_seq START 1;
CREATE SEQUENCE IF NOT EXISTS inspection_number_seq START 1;

-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE public.deviation_severity AS ENUM ('critical','high','medium','low');
CREATE TYPE public.deviation_status AS ENUM ('open','investigating','dispositioned','closed');
CREATE TYPE public.deviation_type AS ENUM ('process','product','regulatory');

CREATE TYPE public.audit_status AS ENUM ('scheduled','in_progress','completed','cancelled');
CREATE TYPE public.audit_type AS ENUM ('internal','external','supplier');

CREATE TYPE public.change_status AS ENUM ('initiated','risk_assessment','pending_approval','approved','implementing','effectiveness_check','closed','rejected');
CREATE TYPE public.change_type AS ENUM ('product','process','equipment','supplier','document');

CREATE TYPE public.inspection_status AS ENUM ('pending','in_progress','accepted','rejected','conditional','hold_pending_lims');

CREATE TYPE public.document_status AS ENUM ('draft','pending_approval','approved','superseded');
CREATE TYPE public.document_type AS ENUM ('food_safety_plan','haccp_plan','sop','quality_plan','specification','prp','ewi');

CREATE TYPE public.calibration_status AS ENUM ('in_calibration','due_soon','overdue','out_of_service');
CREATE TYPE public.calibration_result AS ENUM ('in_tolerance','out_of_tolerance');

CREATE TYPE public.training_result AS ENUM ('pass','fail','pending');

-- ============================================================
-- HACCP CCPs
-- ============================================================
CREATE TABLE public.haccp_ccps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ccp_number text NOT NULL,
  process_step text NOT NULL,
  hazard_type text NOT NULL DEFAULT 'biological',
  hazard_description text,
  critical_limit_upper numeric,
  critical_limit_lower numeric,
  critical_limit_unit text,
  monitoring_method text,
  monitoring_frequency text,
  corrective_action_procedure text,
  responsible_operator text,
  status text NOT NULL DEFAULT 'active',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.haccp_ccps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth view ccps" ON public.haccp_ccps FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth create ccps" ON public.haccp_ccps FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update ccps" ON public.haccp_ccps FOR UPDATE TO authenticated USING (true);

-- CCP Monitoring Records
CREATE TABLE public.ccp_monitoring_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ccp_id uuid REFERENCES public.haccp_ccps(id) ON DELETE CASCADE NOT NULL,
  value numeric NOT NULL,
  within_limits boolean NOT NULL DEFAULT true,
  recorded_by uuid,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ccp_monitoring_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth view ccp_mon" ON public.ccp_monitoring_records FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth create ccp_mon" ON public.ccp_monitoring_records FOR INSERT TO authenticated WITH CHECK (true);

-- ============================================================
-- INCOMING INSPECTIONS
-- ============================================================
CREATE TABLE public.incoming_inspections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_number text NOT NULL DEFAULT '',
  supplier_id uuid REFERENCES public.suppliers(id),
  ingredient text NOT NULL,
  lot_code text,
  quantity numeric,
  quantity_unit text DEFAULT 'kg',
  status inspection_status NOT NULL DEFAULT 'pending',
  disposition text,
  inspector_id uuid,
  coa_verified boolean DEFAULT false,
  physical_check_passed boolean,
  lims_required boolean DEFAULT false,
  lims_result text,
  notes text,
  inspected_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.incoming_inspections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth view inspections" ON public.incoming_inspections FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth create inspections" ON public.incoming_inspections FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update inspections" ON public.incoming_inspections FOR UPDATE TO authenticated USING (true);

CREATE OR REPLACE FUNCTION public.generate_inspection_number()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  NEW.inspection_number := 'INS-' || TO_CHAR(now(), 'YYYY') || '-' || LPAD(nextval('inspection_number_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$$;
CREATE TRIGGER set_inspection_number BEFORE INSERT ON public.incoming_inspections
FOR EACH ROW WHEN (NEW.inspection_number = '' OR NEW.inspection_number IS NULL) EXECUTE FUNCTION generate_inspection_number();

-- ============================================================
-- DEVIATIONS / NCRs
-- ============================================================
CREATE TABLE public.deviations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deviation_number text NOT NULL DEFAULT '',
  type deviation_type NOT NULL DEFAULT 'process',
  severity deviation_severity NOT NULL DEFAULT 'medium',
  status deviation_status NOT NULL DEFAULT 'open',
  title text NOT NULL,
  description text,
  source text DEFAULT 'manual',
  product_affected text,
  batch_affected text,
  disposition text,
  investigation_notes text,
  capa_id uuid REFERENCES public.capas(id),
  reported_by uuid,
  closed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.deviations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth view deviations" ON public.deviations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth create deviations" ON public.deviations FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update deviations" ON public.deviations FOR UPDATE TO authenticated USING (true);

CREATE OR REPLACE FUNCTION public.generate_deviation_number()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  NEW.deviation_number := 'DEV-' || TO_CHAR(now(), 'YYYY') || '-' || LPAD(nextval('deviation_number_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$$;
CREATE TRIGGER set_deviation_number BEFORE INSERT ON public.deviations
FOR EACH ROW WHEN (NEW.deviation_number = '' OR NEW.deviation_number IS NULL) EXECUTE FUNCTION generate_deviation_number();

-- ============================================================
-- AUDITS
-- ============================================================
CREATE TABLE public.audits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_number text NOT NULL DEFAULT '',
  title text NOT NULL,
  audit_type audit_type NOT NULL DEFAULT 'internal',
  standard text,
  status audit_status NOT NULL DEFAULT 'scheduled',
  scheduled_date timestamptz,
  completed_date timestamptz,
  lead_auditor_id uuid,
  scope text,
  summary text,
  score numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.audits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth view audits" ON public.audits FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth create audits" ON public.audits FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update audits" ON public.audits FOR UPDATE TO authenticated USING (true);

CREATE OR REPLACE FUNCTION public.generate_audit_number()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  NEW.audit_number := 'AUD-' || TO_CHAR(now(), 'YYYY') || '-' || LPAD(nextval('audit_number_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$$;
CREATE TRIGGER set_audit_number BEFORE INSERT ON public.audits
FOR EACH ROW WHEN (NEW.audit_number = '' OR NEW.audit_number IS NULL) EXECUTE FUNCTION generate_audit_number();

-- Audit findings
CREATE TABLE public.audit_findings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id uuid REFERENCES public.audits(id) ON DELETE CASCADE NOT NULL,
  finding_number integer NOT NULL DEFAULT 1,
  severity text NOT NULL DEFAULT 'minor',
  category text,
  description text NOT NULL,
  evidence text,
  corrective_action text,
  capa_id uuid REFERENCES public.capas(id),
  status text NOT NULL DEFAULT 'open',
  closed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_findings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth view findings" ON public.audit_findings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth create findings" ON public.audit_findings FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update findings" ON public.audit_findings FOR UPDATE TO authenticated USING (true);

-- ============================================================
-- CHANGE CONTROL
-- ============================================================
CREATE TABLE public.change_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  change_number text NOT NULL DEFAULT '',
  title text NOT NULL,
  change_type change_type NOT NULL DEFAULT 'process',
  status change_status NOT NULL DEFAULT 'initiated',
  description text,
  reason text,
  risk_level text DEFAULT 'low',
  food_safety_impact text,
  regulatory_impact text,
  quality_impact text,
  operational_impact text,
  initiator_id uuid,
  approver_ids uuid[] DEFAULT '{}',
  approved_by uuid[] DEFAULT '{}',
  target_date timestamptz,
  implemented_at timestamptz,
  implemented_by uuid,
  effectiveness_result text,
  effectiveness_date timestamptz,
  closed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.change_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth view changes" ON public.change_requests FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth create changes" ON public.change_requests FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update changes" ON public.change_requests FOR UPDATE TO authenticated USING (true);

CREATE OR REPLACE FUNCTION public.generate_change_number()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  NEW.change_number := 'CHG-' || TO_CHAR(now(), 'YYYY') || '-' || LPAD(nextval('change_number_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$$;
CREATE TRIGGER set_change_number BEFORE INSERT ON public.change_requests
FOR EACH ROW WHEN (NEW.change_number = '' OR NEW.change_number IS NULL) EXECUTE FUNCTION generate_change_number();

-- ============================================================
-- DOCUMENT CONTROL
-- ============================================================
CREATE TABLE public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  doc_type document_type NOT NULL DEFAULT 'sop',
  version integer NOT NULL DEFAULT 1,
  status document_status NOT NULL DEFAULT 'draft',
  content text,
  file_url text,
  linked_entities text[] DEFAULT '{}',
  approved_by uuid,
  approved_at timestamptz,
  superseded_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth view docs" ON public.documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth create docs" ON public.documents FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update docs" ON public.documents FOR UPDATE TO authenticated USING (true);

-- ============================================================
-- CALIBRATION
-- ============================================================
CREATE TABLE public.calibration_instruments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instrument_id text NOT NULL,
  name text NOT NULL,
  type text,
  location text,
  manufacturer text,
  model text,
  serial_number text,
  status calibration_status NOT NULL DEFAULT 'in_calibration',
  last_calibration_date timestamptz,
  next_calibration_due timestamptz,
  calibration_frequency_days integer DEFAULT 365,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.calibration_instruments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth view instruments" ON public.calibration_instruments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth create instruments" ON public.calibration_instruments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update instruments" ON public.calibration_instruments FOR UPDATE TO authenticated USING (true);

CREATE TABLE public.calibration_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instrument_id uuid REFERENCES public.calibration_instruments(id) ON DELETE CASCADE NOT NULL,
  calibrated_by uuid,
  calibration_date timestamptz NOT NULL DEFAULT now(),
  result calibration_result NOT NULL,
  certificate_reference text,
  notes text,
  next_due_date timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.calibration_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth view cal_records" ON public.calibration_records FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth create cal_records" ON public.calibration_records FOR INSERT TO authenticated WITH CHECK (true);

-- ============================================================
-- TRAINING & COMPETENCE
-- ============================================================
CREATE TABLE public.training_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_name text NOT NULL,
  employee_id_ref text,
  topic text NOT NULL,
  training_date timestamptz NOT NULL DEFAULT now(),
  trainer text,
  format text DEFAULT 'classroom',
  result training_result NOT NULL DEFAULT 'pending',
  qualification_name text,
  qualification_expiry timestamptz,
  effectiveness_assessed boolean DEFAULT false,
  effectiveness_score numeric,
  notes text,
  recorded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.training_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth view training" ON public.training_records FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth create training" ON public.training_records FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update training" ON public.training_records FOR UPDATE TO authenticated USING (true);

-- ============================================================
-- RISK REGISTER
-- ============================================================
CREATE TABLE public.risk_register (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL DEFAULT 'HACCP',
  description text NOT NULL,
  likelihood integer NOT NULL DEFAULT 1 CHECK (likelihood >= 1 AND likelihood <= 5),
  severity integer NOT NULL DEFAULT 1 CHECK (severity >= 1 AND severity <= 5),
  risk_score integer GENERATED ALWAYS AS (likelihood * severity) STORED,
  control_measures text,
  residual_likelihood integer DEFAULT 1,
  residual_severity integer DEFAULT 1,
  residual_risk_score integer GENERATED ALWAYS AS (COALESCE(residual_likelihood,1) * COALESCE(residual_severity,1)) STORED,
  owner text,
  review_date timestamptz,
  status text NOT NULL DEFAULT 'active',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.risk_register ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth view risks" ON public.risk_register FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth create risks" ON public.risk_register FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update risks" ON public.risk_register FOR UPDATE TO authenticated USING (true);

-- Storage bucket for documents
INSERT INTO storage.buckets (id, name, public) VALUES ('qms-documents', 'qms-documents', false) ON CONFLICT (id) DO NOTHING;
CREATE POLICY "Auth upload qms docs" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'qms-documents');
CREATE POLICY "Auth view qms docs" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'qms-documents');
CREATE POLICY "Auth delete qms docs" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'qms-documents');
