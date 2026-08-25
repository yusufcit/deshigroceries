import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('id')
    .eq('id', user.id)
    .eq('is_active', true)
    .single()
  if (!adminUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  return createAdminClient()
}

// POST /api/admin/delivery-slots/overrides
// Upserts a date-specific override:
//   slot_id  null      -> applies to the WHOLE day (close Eid/Christmas, or
//                          cap every slot that day)
//   slot_id  <uuid>    -> applies to one slot on that date only
//   is_closed true     -> slot/day cannot take orders
//   max_orders set     -> temporary capacity that overrides the weekly value
//   is_closed false & no max_orders -> clears the override (back to schedule)
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin()
    if (admin instanceof NextResponse) return admin
    const body = await request.json().catch(() => null)
    if (!body?.date) return NextResponse.json({ error: 'Date is required.' }, { status: 400 })
    if (!DATE_RE.test(body.date)) return NextResponse.json({ error: 'Date must be YYYY-MM-DD.' }, { status: 400 })

    const slotId = body.slot_id && typeof body.slot_id === 'string' ? body.slot_id : null
    const isClosed = body.is_closed === true
    const maxOrders =
      body.max_orders === undefined || body.max_orders === null || body.max_orders === ''
        ? null
        : Number(body.max_orders)
    const note = typeof body.note === 'string' ? String(body.note).trim().slice(0, 200) || null : null

    if (maxOrders !== null && (!Number.isInteger(maxOrders) || maxOrders < 1)) {
      return NextResponse.json({ error: 'Max orders must be a positive whole number.' }, { status: 400 })
    }
    if (!isClosed && maxOrders === null && note === null) {
      return NextResponse.json({ error: 'Nothing to change.' }, { status: 400 })
    }

    // Whole-day rows use slot_id IS NULL; per-slot rows use the slot id.
    const q = admin.from('delivery_slot_overrides')
    let existing = null
    if (slotId) {
      const { data } = await q.select('id').eq('date', body.date).eq('slot_id', slotId).maybeSingle()
      existing = data
    } else {
      const { data } = await q.select('id').eq('date', body.date).is('slot_id', null).maybeSingle()
      existing = data
    }

    if (existing) {
      const { data, error } = await admin
        .from('delivery_slot_overrides')
        .update({ is_closed: isClosed, max_orders: maxOrders, note })
        .eq('id', existing.id)
        .select('date, slot_id, is_closed, max_orders, note')
        .single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ override: data })
    }

    const { data, error } = await admin
      .from('delivery_slot_overrides')
      .insert({ date: body.date, slot_id: slotId, is_closed: isClosed, max_orders: maxOrders, note })
      .select('date, slot_id, is_closed, max_orders, note')
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ override: data }, { status: 201 })
  } catch (err) {
    console.error('[admin delivery-slots overrides POST]', err)
    return NextResponse.json({ error: 'Could not save the override.' }, { status: 500 })
  }
}

// DELETE /api/admin/delivery-slots/overrides
// Removes a date-specific override (slot_id null = whole-day row).
export async function DELETE(request: NextRequest) {
  try {
    const admin = await requireAdmin()
    if (admin instanceof NextResponse) return admin
    const body = await request.json().catch(() => null)
    if (!body?.date) return NextResponse.json({ error: 'Date is required.' }, { status: 400 })

    const slotId = body.slot_id && typeof body.slot_id === 'string' ? body.slot_id : null
    const q = admin.from('delivery_slot_overrides').delete().eq('date', body.date)
    if (slotId) q.eq('slot_id', slotId)
    else q.is('slot_id', null)

    const { error } = await q
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[admin delivery-slots overrides DELETE]', err)
    return NextResponse.json({ error: 'Could not remove the override.' }, { status: 500 })
  }
}