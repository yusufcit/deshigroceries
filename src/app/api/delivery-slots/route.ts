import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  getDeliveryDays,
  slotLabel,
  type AvailableDay,
  type AvailableSlot,
} from '@/lib/delivery-slots'

// Public storefront availability. Bookings themselves are NOT publicly
// readable (RLS) — the server computes availability here using the
// service-role client. Degrades to the hard-coded schedule when the
// delivery-slots migration has not been applied yet.

export const dynamic = 'force-dynamic'

const WINDOW_DAYS = 7

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function fallbackDays(): AvailableDay[] {
  return getDeliveryDays().map((d) => ({
    date: d.date,
    label: d.label,
    dayClosed: false,
    slots: d.slots.map<AvailableSlot>((s) => ({
      id: null,
      label: s,
      available: true,
      remaining: null,
      maxOrders: null,
    })),
  }))
}

function isoDow(date: string): number {
  // DB convention matches JS Date#getUTCDay(): Sunday=0 .. Saturday=6.
  // The orders validator resolves slots with the same function, so the two
  // always agree (including Sundays, which the old "Monday=1..Sunday=7" mapping
  // got wrong).
  return new Date(`${date}T00:00:00Z`).getUTCDay()
}

export async function GET(_request: NextRequest) {
  try {
    const admin = createAdminClient()

    const now = new Date()
    const dates: string[] = []
    for (let i = 1; i <= WINDOW_DAYS; i++) {
      const d = new Date(now)
      d.setDate(d.getDate() + i)
      dates.push(dateKey(d))
    }
    const from = dates[0]
    const to = dates[dates.length - 1]

    const nowIso = new Date().toISOString()
    const [sched, ovs, bks, resv] = await Promise.all([
      admin
        .from('delivery_slots')
        .select('id, day_of_week, start_time, end_time, max_orders, is_active, display_order')
        .eq('is_active', true)
        .order('display_order'),
      admin
        .from('delivery_slot_overrides')
        .select('date, slot_id, is_closed, max_orders')
        .gte('date', from)
        .lte('date', to),
      admin
        .from('delivery_slot_bookings')
        .select('booking_date, slot_id, booked_count')
        .gte('booking_date', from)
        .lte('booking_date', to),
      // Only ACTIVE, unexpired holdings block capacity (lazy expiry: rows that
      // have past expires_at are ignored even before any cleanup job runs).
      admin
        .from('delivery_slot_reservations')
        .select('delivery_date, delivery_slot_id')
        .eq('status', 'ACTIVE')
        .gt('expires_at', nowIso)
        .gte('delivery_date', from)
        .lte('delivery_date', to),
    ])

    // Migration not applied (or empty schedule) → previous hard-coded behaviour
    if (sched.error || !sched.data?.length) {
      return NextResponse.json({ days: fallbackDays(), source: 'fallback' }, { headers: { 'Cache-Control': 'no-store' } })
    }

    const bookedMap = new Map<string, number>()
    for (const b of bks.data ?? []) {
      bookedMap.set(`${b.booking_date}|${b.slot_id}`, b.booked_count)
    }
    // Active card reservations also block capacity until they expire.
    const reserveMap = new Map<string, number>()
    for (const r of resv.data ?? []) {
      const k = `${r.delivery_date}|${r.delivery_slot_id}`
      reserveMap.set(k, (reserveMap.get(k) ?? 0) + 1)
    }
    const overrideMap = new Map<string, { is_closed: boolean; max_orders: number | null }>()
    for (const o of ovs.data ?? []) {
      overrideMap.set(`${o.date}|${o.slot_id ?? ''}`, { is_closed: o.is_closed, max_orders: o.max_orders })
    }

    const days: AvailableDay[] = dates.map((date) => {
      const label = new Date(`${date}T00:00:00`).toLocaleDateString('en-IE', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      })
      const dayWide = overrideMap.get(`${date}|`)
      const dayClosed = dayWide?.is_closed === true

      const slots: AvailableSlot[] = (sched.data ?? [])
        .filter((s) => s.day_of_week === isoDow(date))
        .map((s) => {
          const ov = overrideMap.get(`${date}|${s.id}`)
          if (ov?.is_closed) {
            return { id: s.id, label: slotLabel(s.start_time, s.end_time), available: false, remaining: 0, maxOrders: ov.max_orders }
          }
          const max = ov && ov.max_orders != null ? ov.max_orders : s.max_orders
          const booked = bookedMap.get(`${date}|${s.id}`) ?? 0
          // A live card reservation occupies one unit; a slot is only truly
          // free while booked + reserved < capacity.
          const reserved = reserveMap.get(`${date}|${s.id}`) ?? 0
          const remaining = max != null ? Math.max(max - booked - reserved, 0) : null
          return {
            id: s.id,
            label: slotLabel(s.start_time, s.end_time),
            available: remaining == null ? true : remaining > 0,
            remaining,
            maxOrders: max,
          }
        })

      return { date, label, dayClosed, slots }
    })

    return NextResponse.json({ days, source: 'db' }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (err) {
    console.error('[delivery-slots GET]', err instanceof Error ? err.message : err)
    return NextResponse.json({ days: fallbackDays(), source: 'fallback' }, { headers: { 'Cache-Control': 'no-store' } })
  }
}
