
-- Add RCA and verification fields to capas
ALTER TABLE public.capas 
ADD COLUMN IF NOT EXISTS root_cause_notes text,
ADD COLUMN IF NOT EXISTS effectiveness_result text,
ADD COLUMN IF NOT EXISTS effectiveness_check_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS verified_by uuid,
ADD COLUMN IF NOT EXISTS verified_at timestamp with time zone;

-- Create storage bucket for COA documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('supplier-coa-documents', 'supplier-coa-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for COA documents
CREATE POLICY "Authenticated users can upload COA docs"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'supplier-coa-documents');

CREATE POLICY "Authenticated users can view COA docs"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'supplier-coa-documents');

CREATE POLICY "Authenticated users can delete COA docs"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'supplier-coa-documents');
