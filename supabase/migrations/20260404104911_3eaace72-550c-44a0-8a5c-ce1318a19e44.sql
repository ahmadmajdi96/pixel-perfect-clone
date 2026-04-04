
-- Regulatory Compliance
CREATE TABLE public.regulatory_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_reference TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  market TEXT NOT NULL DEFAULT 'US',
  effective_date TIMESTAMPTZ,
  enforcement_date TIMESTAMPTZ,
  source TEXT DEFAULT 'manual',
  impact_count INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.sku_compliance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name TEXT NOT NULL,
  product_code TEXT,
  market TEXT NOT NULL DEFAULT 'US',
  compliance_status TEXT NOT NULL DEFAULT 'compliant',
  rule_id UUID REFERENCES public.regulatory_rules(id),
  deadline TIMESTAMPTZ,
  capa_id UUID REFERENCES public.capas(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Management Review
CREATE TABLE public.management_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  review_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'scheduled',
  attendees TEXT[],
  minutes TEXT,
  data_pack_generated BOOLEAN DEFAULT false,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.review_action_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID REFERENCES public.management_reviews(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  owner TEXT,
  due_date TIMESTAMPTZ,
  priority TEXT DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'open',
  capa_id UUID REFERENCES public.capas(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Pest Control
CREATE TABLE public.pest_sightings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sighting_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  pest_type TEXT NOT NULL,
  location TEXT NOT NULL,
  quantity_estimate TEXT,
  activity_level TEXT NOT NULL DEFAULT 'low',
  immediate_action TEXT,
  corrective_action TEXT,
  corrective_action_status TEXT DEFAULT 'none',
  reported_by UUID,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.pest_bait_stations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  station_code TEXT NOT NULL,
  location TEXT NOT NULL,
  station_type TEXT NOT NULL DEFAULT 'bait',
  status TEXT NOT NULL DEFAULT 'active',
  last_inspected_at TIMESTAMPTZ,
  next_inspection_due TIMESTAMPTZ,
  contractor TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Product & Customer Specifications
CREATE TABLE public.product_specifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name TEXT NOT NULL,
  product_code TEXT,
  spec_type TEXT NOT NULL DEFAULT 'internal',
  customer_name TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'draft',
  effective_date TIMESTAMPTZ,
  review_date TIMESTAMPTZ,
  approved_by UUID,
  parameters JSONB DEFAULT '[]'::jsonb,
  compliance_status TEXT DEFAULT 'compliant',
  last_checked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Food Defence & Food Fraud
CREATE TABLE public.food_defence_threats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  threat_type TEXT NOT NULL DEFAULT 'taccp',
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  threat_actor TEXT,
  attack_scenario TEXT,
  likelihood INTEGER NOT NULL DEFAULT 1,
  severity INTEGER NOT NULL DEFAULT 1,
  risk_score INTEGER,
  mitigation_measures TEXT,
  residual_risk_score INTEGER,
  status TEXT NOT NULL DEFAULT 'active',
  review_date TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- GMP Inspections
CREATE TABLE public.gmp_inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_type TEXT NOT NULL DEFAULT 'pre_operational',
  area TEXT NOT NULL,
  inspector_id UUID,
  inspector_name TEXT,
  scheduled_date TIMESTAMPTZ,
  completed_date TIMESTAMPTZ,
  score_pct NUMERIC,
  pass_count INTEGER DEFAULT 0,
  fail_count INTEGER DEFAULT 0,
  critical_fail_count INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.gmp_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID REFERENCES public.gmp_inspections(id) ON DELETE CASCADE NOT NULL,
  section TEXT NOT NULL,
  item_description TEXT NOT NULL,
  is_critical BOOLEAN DEFAULT false,
  result TEXT DEFAULT 'pending',
  observation TEXT,
  corrective_action TEXT,
  corrective_action_owner TEXT,
  corrective_action_due TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Glass & Brittle Material Control
CREATE TABLE public.glass_register (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_code TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT NOT NULL,
  item_type TEXT NOT NULL DEFAULT 'glass',
  quantity INTEGER DEFAULT 1,
  purpose TEXT,
  inspection_frequency TEXT DEFAULT 'daily',
  last_inspected_at TIMESTAMPTZ,
  next_inspection_due TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'ok',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.glass_breakages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES public.glass_register(id),
  breakage_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  location TEXT NOT NULL,
  quantity_broken INTEGER DEFAULT 1,
  product_at_risk TEXT,
  batch_at_risk TEXT,
  all_fragments_recovered BOOLEAN DEFAULT false,
  immediate_action TEXT,
  investigation_findings TEXT,
  corrective_action TEXT,
  product_disposition TEXT,
  reported_by UUID,
  status TEXT NOT NULL DEFAULT 'investigating',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Finished Product Testing
CREATE TABLE public.product_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name TEXT NOT NULL,
  product_code TEXT,
  batch_number TEXT,
  test_type TEXT NOT NULL DEFAULT 'microbiological',
  test_frequency TEXT DEFAULT 'weekly',
  sampling_point TEXT DEFAULT 'end_of_line',
  last_tested_date TIMESTAMPTZ,
  next_due_date TIMESTAMPTZ,
  result TEXT DEFAULT 'pending',
  lab_reference TEXT,
  result_detail JSONB DEFAULT '{}'::jsonb,
  capa_id UUID REFERENCES public.capas(id),
  status TEXT NOT NULL DEFAULT 'scheduled',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Water Quality
CREATE TABLE public.water_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_type TEXT NOT NULL DEFAULT 'potability',
  sampling_point TEXT NOT NULL,
  test_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  result TEXT NOT NULL DEFAULT 'pass',
  parameter_values JSONB DEFAULT '{}'::jsonb,
  tested_by UUID,
  notes TEXT,
  corrective_action TEXT,
  next_due_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'compliant',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Specialty Certifications
CREATE TABLE public.specialty_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  certification_type TEXT NOT NULL,
  certifying_body TEXT,
  certificate_number TEXT,
  product_scope TEXT,
  effective_date TIMESTAMPTZ,
  expiry_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active',
  approved_ingredients JSONB DEFAULT '[]'::jsonb,
  audit_date TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Continuous Improvement
CREATE TABLE public.improvement_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  methodology TEXT NOT NULL DEFAULT 'pdca',
  category TEXT DEFAULT 'quality',
  description TEXT,
  owner TEXT,
  status TEXT NOT NULL DEFAULT 'plan',
  target_metric TEXT,
  baseline_value NUMERIC,
  target_value NUMERIC,
  current_value NUMERIC,
  savings_estimated NUMERIC,
  savings_actual NUMERIC,
  start_date TIMESTAMPTZ,
  target_completion TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.regulatory_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sku_compliance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.management_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_action_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pest_sightings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pest_bait_stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_specifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_defence_threats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gmp_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gmp_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.glass_register ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.glass_breakages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.water_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.specialty_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.improvement_projects ENABLE ROW LEVEL SECURITY;

-- RLS policies for all new tables (authenticated users)
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'regulatory_rules','sku_compliance','management_reviews','review_action_items',
    'pest_sightings','pest_bait_stations','product_specifications','food_defence_threats',
    'gmp_inspections','gmp_checklist_items','glass_register','glass_breakages',
    'product_tests','water_tests','specialty_certifications','improvement_projects'
  ]) LOOP
    EXECUTE format('CREATE POLICY "Auth view %s" ON public.%I FOR SELECT TO authenticated USING (true)', tbl, tbl);
    EXECUTE format('CREATE POLICY "Auth create %s" ON public.%I FOR INSERT TO authenticated WITH CHECK (true)', tbl, tbl);
    EXECUTE format('CREATE POLICY "Auth update %s" ON public.%I FOR UPDATE TO authenticated USING (true)', tbl, tbl);
  END LOOP;
END $$;
