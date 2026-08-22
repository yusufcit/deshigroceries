/**
 * Supabase Storage helpers for product images — SERVER ONLY.
 *
 * Flow:
 *   admin browser → POST /api/admin/uploads/presign  (admin auth, validation)
 *   admin browser → PUT bytes DIRECTLY to Supabase Storage signed URL
 *   customer UI  → reads the image via the bucket's public URL
 *
 * The file bytes never pass through this Next.js server, and Supabase
 * credentials never reach the browser.
 */
import { createClient } from '@supabase/supabase-js'

/** Storage bucket holding all product images (must exist — see supabase-product-images-bucket.sql). */
export const PRODUCT_IMAGES_BUCKET = 'product-images'

/** Maximum accepted upload size (bytes). */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024

/** Accepted MIME types → file extension. SVG and executables intentionally excluded. */
const ALLOWED_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
}

export class UploadValidationError extends Error {}

/** Public URL for any object in the bucket (safe for browsers). */
export function getPublicUrl(path: string): string {
  const base = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/+$/, '')
  if (!base) return ''
  return `${base}/storage/v1/object/public/${PRODUCT_IMAGES_BUCKET}/${path}`
}

/**
 * Validate a requested upload and build a safe, server-generated object path.
 * Returns { path, contentType } or throws UploadValidationError.
 */
export function buildImagePath(contentType: string, size: unknown): { path: string; contentType: string } {
  const ext = ALLOWED_MIME[contentType]
  if (!ext) throw new UploadValidationError('Unsupported file type. Use JPG, PNG, WebP or AVIF.')

  const sizeNum = Number(size)
  if (!Number.isFinite(sizeNum) || sizeNum <= 0) {
    throw new UploadValidationError('Invalid file size.')
  }
  if (sizeNum > MAX_UPLOAD_BYTES) {
    throw new UploadValidationError('File is too large. Maximum is 10 MB.')
  }

  // Never use the original filename — always a fresh server-generated path.
  return { path: `products/${crypto.randomUUID()}.${ext}`, contentType }
}

/** Create a short-lived signed upload URL for a single object (service role). */
export async function createSignedUploadUrl(path: string) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data, error } = await supabaseAdmin.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .createSignedUploadUrl(path, { upsert: false })

  if (error || !data?.signedUrl) {
    throw new Error(error?.message || 'Could not create an upload URL.')
  }

  return data.signedUrl as string
}