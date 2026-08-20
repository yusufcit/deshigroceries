import { createClient } from '@supabase/supabase-js'
import { createClient as createSupaClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  // Use regular SSR client for auth check
  const supabase = await createSupaClient()
  
  // Check authentication
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check admin status
  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('*')
    .eq('id', user.id)
    .eq('is_active', true)
    .single()

  if (!adminUser) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Use service role client to bypass RLS for admin operations
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )

  // Parse and validate request body
  const body = await request.json()
  
  const { name, slug, description, price, compare_at_price, category_id, stock_quantity, image_url, is_available, is_featured } = body

  if (!name || price === undefined || price === null) {
    return NextResponse.json({ error: 'Name and price are required' }, { status: 400 })
  }

  // Generate slug from name if not provided
  const finalSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

  const { data, error } = await supabaseAdmin.from('products').insert({
    name,
    slug: finalSlug,
    description: description || null,
    price: parseFloat(price),
    compare_at_price: compare_at_price ? parseFloat(compare_at_price) : null,
    category_id: category_id || null,
    stock_quantity: parseInt(stock_quantity) || 0,
    image_url: image_url || null,
    is_available: is_available ?? true,
    is_featured: is_featured ?? false,
  }).select().single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ product: data }, { status: 201 })
}
