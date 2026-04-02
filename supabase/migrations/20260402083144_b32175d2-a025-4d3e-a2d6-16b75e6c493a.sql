-- Enums
CREATE TYPE public.app_role AS ENUM ('qa_manager', 'food_safety_manager', 'quality_technician', 'food_technologist', 'supplier_quality_manager', 'plant_manager', 'system_admin');

CREATE TYPE public.capa_status AS ENUM ('initiation', 'root_cause_analysis', 'action_assignment', 'preventive_action', 'verification', 'effectiveness_check', 'closure');

CREATE TYPE public.capa_severity AS ENUM ('critical', 'high', 'medium', 'low');

CREATE TYPE public.supplier_status AS ENUM ('approved', 'conditional', 'suspended', 'rejected', 'pending');

CREATE TYPE public.complaint_severity AS ENUM ('critical', 'high', 'medium', 'low');

CREATE TYPE public.complaint_status AS ENUM ('logged', 'investigating', 'resolved', 'closed');

CREATE TYPE public.complaint_type AS ENUM ('foreign_body', 'allergen', 'mislabeling', 'quality_defect', 'packaging', 'taste_odor', 'microbiological', 'chemical', 'other');

-- Updated at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  department TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- CAPA number sequence
CREATE SEQUENCE IF NOT EXISTS capa_number_seq START 1;

-- CAPAs table
CREATE TABLE public.capas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  capa_number TEXT NOT NULL UNIQUE DEFAULT '',
  title TEXT NOT NULL,
  description TEXT,
  status capa_status NOT NULL DEFAULT 'initiation',
  severity capa_severity NOT NULL DEFAULT 'medium',
  source_type TEXT NOT NULL DEFAULT 'internal',
  source_reference TEXT,
  product_line TEXT,
  owner_id UUID REFERENCES auth.users(id),
  assigned_to UUID REFERENCES auth.users(id),
  sla_deadline TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.capas ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_capas_updated_at BEFORE UPDATE ON public.capas
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.generate_capa_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.capa_number := 'CAPA-' || TO_CHAR(now(), 'YYYY') || '-' || LPAD(nextval('capa_number_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER set_capa_number BEFORE INSERT ON public.capas
FOR EACH ROW WHEN (NEW.capa_number IS NULL OR NEW.capa_number = '')
EXECUTE FUNCTION public.generate_capa_number();

-- CAPA Actions
CREATE TABLE public.capa_actions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  capa_id UUID NOT NULL REFERENCES public.capas(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL DEFAULT 'corrective',
  description TEXT NOT NULL,
  assigned_to UUID REFERENCES auth.users(id),
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.capa_actions ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_capa_actions_updated_at BEFORE UPDATE ON public.capa_actions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- CAPA Timeline
CREATE TABLE public.capa_timeline (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  capa_id UUID NOT NULL REFERENCES public.capas(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  event_type TEXT NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.capa_timeline ENABLE ROW LEVEL SECURITY;

-- Suppliers
CREATE TABLE public.suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  status supplier_status NOT NULL DEFAULT 'pending',
  categories TEXT[] DEFAULT '{}',
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  address TEXT,
  country TEXT,
  last_audit_date TIMESTAMPTZ,
  next_requalification_date TIMESTAMPTZ,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON public.suppliers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Supplier Scorecards
CREATE TABLE public.supplier_scorecards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  period TEXT NOT NULL,
  quality_score NUMERIC(5,2) DEFAULT 0,
  delivery_score NUMERIC(5,2) DEFAULT 0,
  documentation_score NUMERIC(5,2) DEFAULT 0,
  responsiveness_score NUMERIC(5,2) DEFAULT 0,
  compliance_score NUMERIC(5,2) DEFAULT 0,
  overall_score NUMERIC(5,2) DEFAULT 0,
  notes TEXT,
  scored_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.supplier_scorecards ENABLE ROW LEVEL SECURITY;

-- Supplier COAs
CREATE TABLE public.supplier_coas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  ingredient TEXT NOT NULL,
  lot_number TEXT,
  document_url TEXT,
  issue_date TIMESTAMPTZ,
  expiry_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active',
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.supplier_coas ENABLE ROW LEVEL SECURITY;

-- Complaint number sequence
CREATE SEQUENCE IF NOT EXISTS complaint_number_seq START 1;

-- Complaints
CREATE TABLE public.complaints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  complaint_number TEXT NOT NULL UNIQUE DEFAULT '',
  product TEXT NOT NULL,
  batch_number TEXT,
  complaint_type complaint_type NOT NULL DEFAULT 'other',
  severity complaint_severity NOT NULL DEFAULT 'medium',
  status complaint_status NOT NULL DEFAULT 'logged',
  source TEXT NOT NULL DEFAULT 'customer',
  description TEXT NOT NULL,
  complainant_name TEXT,
  complainant_contact TEXT,
  capa_id UUID REFERENCES public.capas(id),
  regulatory_flag BOOLEAN NOT NULL DEFAULT false,
  logged_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_complaints_updated_at BEFORE UPDATE ON public.complaints
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.generate_complaint_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.complaint_number := 'CMP-' || TO_CHAR(now(), 'YYYY') || '-' || LPAD(nextval('complaint_number_seq')::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER set_complaint_number BEFORE INSERT ON public.complaints
FOR EACH ROW WHEN (NEW.complaint_number IS NULL OR NEW.complaint_number = '')
EXECUTE FUNCTION public.generate_complaint_number();

-- Complaint Investigations
CREATE TABLE public.complaint_investigations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
  investigator_id UUID REFERENCES auth.users(id),
  probable_cause TEXT,
  contributing_factors TEXT,
  trend_assessment TEXT,
  findings TEXT,
  recommendations TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.complaint_investigations ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER update_complaint_investigations_updated_at BEFORE UPDATE ON public.complaint_investigations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ RLS POLICIES ============

-- Profiles
CREATE POLICY "Anyone authenticated can view profiles" ON public.profiles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- User roles
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'system_admin'));
CREATE POLICY "Admins can insert roles" ON public.user_roles
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'system_admin'));
CREATE POLICY "Admins can delete roles" ON public.user_roles
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'system_admin'));

-- CAPAs
CREATE POLICY "Authenticated users can view CAPAs" ON public.capas
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create CAPAs" ON public.capas
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update CAPAs" ON public.capas
  FOR UPDATE TO authenticated USING (true);

-- CAPA Actions
CREATE POLICY "Authenticated users can view CAPA actions" ON public.capa_actions
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create CAPA actions" ON public.capa_actions
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update CAPA actions" ON public.capa_actions
  FOR UPDATE TO authenticated USING (true);

-- CAPA Timeline
CREATE POLICY "Authenticated users can view CAPA timeline" ON public.capa_timeline
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can add timeline entries" ON public.capa_timeline
  FOR INSERT TO authenticated WITH CHECK (true);

-- Suppliers
CREATE POLICY "Authenticated users can view suppliers" ON public.suppliers
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create suppliers" ON public.suppliers
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update suppliers" ON public.suppliers
  FOR UPDATE TO authenticated USING (true);

-- Supplier Scorecards
CREATE POLICY "Authenticated users can view scorecards" ON public.supplier_scorecards
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create scorecards" ON public.supplier_scorecards
  FOR INSERT TO authenticated WITH CHECK (true);

-- Supplier COAs
CREATE POLICY "Authenticated users can view COAs" ON public.supplier_coas
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create COAs" ON public.supplier_coas
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update COAs" ON public.supplier_coas
  FOR UPDATE TO authenticated USING (true);

-- Complaints
CREATE POLICY "Authenticated users can view complaints" ON public.complaints
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create complaints" ON public.complaints
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update complaints" ON public.complaints
  FOR UPDATE TO authenticated USING (true);

-- Complaint Investigations
CREATE POLICY "Authenticated users can view investigations" ON public.complaint_investigations
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create investigations" ON public.complaint_investigations
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update investigations" ON public.complaint_investigations
  FOR UPDATE TO authenticated USING (true);