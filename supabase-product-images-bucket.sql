-- ─────────────────────────────────────────────────────────────────────────────
-- Supabase Storage bucket for product images
-- Idempotent — safe to paste into the Supabase SQL editor and re-run.
-- This is the ONLY setup step needed for the admin image upload feature.
-- ─────────────────────────────────────────────────────────────────────────────

-- Create the public bucket (uploads are done via short-lived signed URLs, so
-- no write policies are needed beyond what the service role already has).
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  10485760, -- 10 MB
  ARRAY['image/jpeg','image/png','image/webp','image/avif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Ensure the bucket is publicly readable (images are served to customers via
-- the public URL, e.g. https://<ref>.supabase.co/storage/v1/object/public/...).
DROP POLICY IF EXISTS "Public read product images" ON storage.objects;
CREATE POLICY "Public read product images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');