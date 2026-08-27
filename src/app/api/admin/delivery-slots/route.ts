import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { slotLabel } from '@/lib/delivery-slots'

export const dynamic = 'force-dynamic'

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

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

// GET /api/admin/delivery-slots?days=7
// Returns the weekly schedule plus the next N dates with live booked /
// remaining capacity and date-specific overrides — every value shown on
// the admin management screen comes from this single response.
export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin()
    if (admin instanceof NextResponse) return admin

    const { searchParams } = new URL(request.url)
    const window = Math.min(Math.max(Number(searchParams.get('days')) || 7, 1), 30)

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const dates: string[] = []
    for (let i = 0; i < window; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() + i)
      dates.push(d.toISOString().slice(0, 10))
    }
    const from = dates[0]
    const to = dates[dates.length - 1]

    const [slotsRes, ovRes, bkRes, resRes] = await Promise.all([
      admin
        .from('delivery_slots')
        .select('id, day_of_week, start_time, end_time, max_orders, is_active, display_order')
        .order('display_order', { ascending: true }),
      admin
        .from('delivery_slot_overrides')
        .select('date, slot_id, is_closed, max_orders, note')
        .gte('date', from)
        .lte('date', to),
      admin
        .from('delivery_slot_bookings')
        .select('booking_date, slot_id, booked_count')
        .gte('booking_date', from)
        .lte('booking_date', to),
      admin
        .from('delivery_slot_reservations')
        .select('delivery_date, delivery_slot_id')
        .eq('status', 'ACTIVE')
        .gt('expires_at', new Date().toISOString())
        .gte('delivery_date', from)
        .lte('delivery_date', to),
    ])

    const schedule = (slotsRes.data ?? []).map((s: any) => ({
      id: s.id,
      dayOfWeek: s.day_of_week,
      startTime: s.start_time,
      endTime: s.end_time,
      maxOrders: s.max_orders,
      isActive: s.is_active,
      displayOrder: s.display_order,
      label: slotLabel(s.start_time, s.end_time),
      dayName: DAY_NAMES[s.day_of_week],
    }))

    const ovMap = new Map<string, any>()
    for (const o of ovRes.data ?? []) ovMap.set(`${o.date}|${o.slot_id ?? ''}`, o)

    const bkMap = new Map<string, number>()
    for (const b of bkRes.data ?? []) bkMap.set(`${b.booking_date}|${b.slot_id}`, b.booked_count)

    const resMap = new Map<string, number>()
    for (const r of resRes.data ?? []) {
      const k = `${r.delivery_date}|${r.delivery_slot_id}`
      resMap.set(k, (resMap.get(k) ?? 0) + 1)
    }

    const upcoming = dates.map((date) => {
      const dayWide = ovMap.get(`${date}|`)
      const dayClosed = dayWide?.is_closed === true
      const dayDow = new Date(`${date}T00:00:00Z`).getUTCDay()
      const slots = (slotsRes.data ?? [])
        .filter((s: any) => s.is_active && s.day_of_week === dayDow)
        .map((s: any) => {
          const dayOver = ovMap.get(`${date}|${s.id}`)
          const effectiveMax = dayOver?.max_orders ?? s.max_orders
          const booked = bkMap.get(`${date}|${s.id}`) ?? 0
          // Active card reservations hold capacity but are NOT confirmed orders.
          const reservations = resMap.get(`${date}|${s.id}`) ?? 0
          const remaining = Math.max(effectiveMax - booked - reservations, 0)
          return {
            id: s.id,
            label: slotLabel(s.start_time, s.end_time),
            startTime: s.start_time,
            endTime: s.end_time,
            maxOrders: effectiveMax,
            booked,
            reservations,
            remaining,
            isClosed: dayOver?.is_closed === true,
            override: dayOver
              ? { isClosed: dayOver.is_closed, maxOrders: dayOver.max_orders ?? null, note: dayOver.note ?? null }
              : null,
          }
        })

      return {
        date,
        label: new Date(`${date}T00:00:00Z`).toLocaleDateString('en-IE', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
        }),
        dayClosed,
        dayNote: dayWide?.note ?? null,
        slots,
      }
    })

    return NextResponse.json({ schedule, upcoming, window })
  } catch (err) {
    console.error('[admin delivery-slots GET]', err instanceof Error ? err.message : err)
        return NextResponse.json({ error: 'Could not load delivery slots. Is the delivery-slots migration applied?' }, { status: 500 })
  }
}

// POST /api/admin/delivery-slots — create a recurring weekly slot
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin()
    if (admin instanceof NextResponse) return admin
    const body = await request.json().catch(() => null)
    if (!body) return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })

    const day = Number(body.day_of_week)
    const start = String(body.start_time ?? '')
    const end = String(body.end_time ?? '')
    const maxOrders = Number(body.max_orders)
    const isActive = body.is_active !== false

    if (!Number.isInteger(day) || day < 0 || day > 6)
      return NextResponse.json({ error: 'Day must be 0 (Sunday) – 6 (Saturday).' }, { status: 400 })
    if (!/^\d{2}:\d{2}$/.test(start) || !/^\d{2}:\d{2}$/.test(end))
      return NextResponse.json({ error: 'Times must use HH:MM (24h).' }, { status: 400 })
    if (start >= end)
      return NextResponse.json({ error: 'Start time must be before end time.' }, { status: 400 })
    if (!Number.isInteger(maxOrders) || maxOrders < 1)
      return NextResponse.json({ error: 'Max orders must be a positive whole number.' }, { status: 400 })

    const { data, error } = await admin
      .from('delivery_slots')
      .insert({
        day_of_week: day,
        start_time: start,
        end_time: end,
        max_orders: maxOrders,
        is_active: isActive,
        display_order: Number(body.display_order) || 0,
      })
      .select('id')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ slot: data }, { status: 201 })
  } catch (err) {
    console.error('[admin delivery-slots POST]', err)
    return NextResponse.json({ error: 'Could not create the slot.' }, { status: 500 })
  }
}

// PATCH /api/admin/delivery-slots — update a weekly slot (times, capacity,
// enable/disable, order).
export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireAdmin()
    if (admin instanceof NextResponse) return admin
    const body = await request.json().catch(() => null)
    if (!body?.id) return NextResponse.json({ error: 'Slot id is required.' }, { status: 400 })

    const patch: Record<string, unknown> = {}
    if (body.day_of_week !== undefined) patch.day_of_week = Number(body.day_of_week)
    if (body.start_time !== undefined) patch.start_time = String(body.start_time)
    if (body.end_time !== undefined) patch.end_time = String(body.end_time)
    if (body.max_orders !== undefined) patch.max_orders = Number(body.max_orders)
    if (body.is_active !== undefined) patch.is_active = body.is_active === true
    if (body.display_order !== undefined) patch.display_order = Number(body.display_order)

    const { error } = await admin.from('delivery_slots').update(patch).eq('id', body.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[admin delivery-slots PATCH]', err)
    return NextResponse.json({ error: 'Could not update the slot.' }, { status: 500 })
  }
}

// DELETE /api/admin/delivery-slots — remove a weekly slot entirely.
// Bookings/overrides for it cascade-delete.
export async function DELETE(request: NextRequest) {
  try {
    const admin = await requireAdmin()
    if (admin instanceof NextResponse) return admin
    const body = await request.json().catch(() => null)
    if (!body?.id) return NextResponse.json({ error: 'Slot id is required.' }, { status: 400 })

    const { error } = await admin.from('delivery_slots').delete().eq('id', body.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
    } catch (err) {
    console.error('[admin delivery-slots DELETE]', err)
    return NextResponse.json({ error: 'Could not delete the slot.' }, { status: 500 })
  }
}