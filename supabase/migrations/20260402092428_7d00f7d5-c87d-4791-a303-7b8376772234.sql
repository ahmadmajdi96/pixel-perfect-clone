
-- Environmental Monitoring Program tables
CREATE TABLE public.emp_zones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  zone_name TEXT NOT NULL,
  zone_number TEXT NOT NULL,
  zone_type TEXT NOT NULL DEFAULT 'zone_1',
  area_description TEXT,
  risk_level TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.emp_sampling_points (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  zone_id UUID NOT NULL REFERENCES public.emp_zones(id) ON DELETE CASCADE,
  point_code TEXT NOT NULL,
  location_description TEXT,
  surface_type TEXT,
  test_type TEXT NOT NULL DEFAULT 'swab',
  frequency TEXT NOT NULL DEFAULT 'weekly',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.emp_sample_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sampling_point_id UUID NOT NULL REFERENCES public.emp_sampling_points(id) ON DELETE CASCADE,
  sample_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  result TEXT NOT NULL DEFAULT 'pending',
  organism_detected TEXT,
  cfu_count NUMERIC,
  corrective_action TEXT,
  corrective_action_status TEXT DEFAULT 'none',
  sampled_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.emp_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emp_sampling_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emp_sample_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth view emp_zones" ON public.emp_zones FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth create emp_zones" ON public.emp_zones FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update emp_zones" ON public.emp_zones FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Auth view emp_points" ON public.emp_sampling_points FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth create emp_points" ON public.emp_sampling_points FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update emp_points" ON public.emp_sampling_points FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Auth view emp_results" ON public.emp_sample_results FOR SELECT TO authenticated USING (true);
CREATE POLICY "Auth create emp_results" ON public.emp_sample_results FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Auth update emp_results" ON public.emp_sample_results FOR UPDATE TO authenticated USING (true);
