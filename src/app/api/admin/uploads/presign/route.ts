import { createClient as createSupaClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import {
  buildImagePath,
  createSignedUploadUrl,
  getPublicUrl,
  UploadValidationError,
} from '@/lib/supabase/storage'

/**
 * POST /api/admin/uploads/presign
 * Body: { contentType, size }
 * Returns a short-lived signed upload URL so the admin's browser can upload
 * the image bytes directly to Supabase Storage (never through this server).
 * Only authenticated, active admins may obtain an upload URL.
 */
export async function POST(request: Request) {
  const supabase = await createSupaClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('id')
    .eq('id', user.id)
    .eq('is_active', true)
    .single()
  if (!adminUser) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: { contentType?: unknown; size?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  try {
    const { path } = buildImagePath(String(body?.contentType ?? ''), body?.size)
    const signedUrl = await createSignedUploadUrl(path)
    return NextResponse.json({
      signedUrl,
      path,
      publicUrl: getPublicUrl(path),
    })
  } catch (err) {
    if (err instanceof UploadValidationError) {
      return NextResponse.json({ error: err.message }, { status: 400 })
    }
    console.error('presign error:', err)
    return NextResponse.json(
      { error: 'Could not prepare the upload. Is Supabase Storage configured?' },
      { status: 500 }
    )
  }
}