
-- Allergen profiles table
CREATE TABLE public.allergen_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_name TEXT NOT NULL,
  product_code TEXT,
  contains TEXT[] DEFAULT '{}',
  may_contain TEXT[] DEFAULT '{}',
  free_from TEXT[] DEFAULT '{}',
  cross_contact_risk_score INTEGER DEFAULT 0,
  cross_contact_notes TEXT,
  label_status TEXT NOT NULL DEFAULT 'draft',
  label_last_verified_at TIMESTAMPTZ,
  label_verified_by UUID,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.allergen_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth view allergens" ON public.allergen_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth create allergens" ON public.allergen_profiles FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update allergens" ON public.allergen_profiles FOR UPDATE TO authenticated USING (true);

-- Traceability lots table
CREATE TABLE public.traceability_lots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lot_number TEXT NOT NULL,
  product_name TEXT NOT NULL,
  product_code TEXT,
  batch_date TIMESTAMPTZ DEFAULT now(),
  input_lots TEXT[] DEFAULT '{}',
  output_lots TEXT[] DEFAULT '{}',
  supplier_id UUID,
  quantity NUMERIC,
  quantity_unit TEXT DEFAULT 'kg',
  status TEXT NOT NULL DEFAULT 'active',
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.traceability_lots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth view lots" ON public.traceability_lots FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth create lots" ON public.traceability_lots FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update lots" ON public.traceability_lots FOR UPDATE TO authenticated USING (true);

-- Recall exercises table
CREATE TABLE public.recall_exercises (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exercise_type TEXT NOT NULL DEFAULT 'mock',
  title TEXT NOT NULL,
  trigger_reason TEXT,
  affected_lots TEXT[] DEFAULT '{}',
  scope_description TEXT,
  initiated_by UUID,
  initiated_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  result TEXT,
  recovery_rate_pct NUMERIC,
  time_to_complete_hours NUMERIC,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'in_progress',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.recall_exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth view recalls" ON public.recall_exercises FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth create recalls" ON public.recall_exercises FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update recalls" ON public.recall_exercises FOR UPDATE TO authenticated USING (true);
