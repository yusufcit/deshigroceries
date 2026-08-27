// Delivery-slot system — single source of truth shared by the checkout UI and
// the server-side order validator.
//
// ADMIN-CONTROLLED ARCHITECTURE (preferred):
//   weekly schedule lives in the `delivery_slots` table, date-specific
//   closures/capacity limits in `delivery_slot_overrides`, booked counters in
//   `delivery_slot_bookings`. Availability is computed SERVER-SIDE (see
//   /api/delivery-slots) because the bookings table is intentionally not
//   readable by customers.
//
// FALLBACK: if the migration has not been applied yet, every function here
// degrades gracefully to the previous hard-coded behaviour so checkout never
// breaks during rollout.

export const DELIVERY_SLOT_TIMES = [
  '09:00-11:00',
  '11:00-13:00',
  '14:00-16:00',
  '16:00-18:00',
] as const

export type DeliverySlot = (typeof DELIVERY_SLOT_TIMES)[number]

/**
 * How long a Card checkout temporarily holds a delivery slot while the customer
 * completes Stripe Checkout. The reservation auto-expires after this even if
 * the customer abandons payment — the DB stores `expires_at` and every
 * availability/confirm query filters on it (lazy expiry, no cron required).
 */
export const CARD_SLOT_RESERVATION_MINUTES = 15

/** How many days ahead customers can book (day 1 = tomorrow). */
const BOOKING_WINDOW_DAYS = 7

/**
 * Fallback capacity per date+slot (only used when the DB tables are absent).
 * Overridable via DELIVERY_SLOT_CAPACITY env var.
 */
export function getSlotCapacity(): number {
  const n = Number(process.env.DELIVERY_SLOT_CAPACITY)
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 8
}

function toDateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export interface DeliveryDay {
  date: string // YYYY-MM-DD
  label: string // e.g. "Mon, 24 Aug"
  slots: readonly string[]
}

/** Fallback bookable days starting tomorrow (hard-coded windows). */
export function getDeliveryDays(now: Date = new Date()): DeliveryDay[] {
  const days: DeliveryDay[] = []
  for (let i = 1; i <= BOOKING_WINDOW_DAYS; i++) {
    const d = new Date(now)
    d.setDate(d.getDate() + i)
    days.push({
      date: toDateKey(d),
      label: d.toLocaleDateString('en-IE', { weekday: 'short', day: 'numeric', month: 'short' }),
      slots: [...DELIVERY_SLOT_TIMES],
    })
  }
  return days
}

// ---------------------------------------------------------------------------
// DB-backed availability (shapes returned by /api/delivery-slots)
// ---------------------------------------------------------------------------

export interface AvailableSlot {
  /** UUID from delivery_slots (null in fallback mode) */
  id: string | null
  /** e.g. "09:00-11:00" — this exact string is submitted with the order */
  label: string
  /** false when closed by admin or fully booked */
  available: boolean
  /** null when the system cannot know (fallback mode) */
  remaining: number | null
  maxOrders: number | null
}

export interface AvailableDay {
  date: string
  label: string
  dayClosed: boolean
  slots: AvailableSlot[]
}

/** "09:00" + "11:00" -> "09:00-11:00" */
export function slotLabel(start: string, end: string): string {
  return `${start.slice(0, 5)}-${end.slice(0, 5)}`
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

/**
 * Structural check only — verifies format + that the date is inside the
 * booking window. Capacity/closure enforcement happens against the database
 * at order time (reserve_delivery_slot RPC).
 */
export function isValidSlotChoice(date: string, slot: string, now: Date = new Date()): boolean {
  if (!DATE_RE.test(date)) return false
  if (!/^\d{2}:\d{2}-\d{2}:\d{2}$/.test(slot)) return false
  const [h1, h2] = slot.split('-')
  if (Number(h1.slice(0, 2)) >= Number(h2.slice(0, 2))) return false
  const min = new Date(now)
  min.setDate(min.getDate() + 1)
  min.setHours(0, 0, 0, 0)
  const max = new Date(now)
  max.setDate(max.getDate() + BOOKING_WINDOW_DAYS)
  max.setHours(23, 59, 59, 999)
  const t = new Date(`${date}T00:00:00`)
  return !Number.isNaN(t.getTime()) && t >= min && t <= max
}

// ---------------------------------------------------------------------------
// Delivery fee rules (single source of truth for cart UI + server validation)
// ---------------------------------------------------------------------------

export const DELIVERY_FEE = 4.99
export const FREE_DELIVERY_THRESHOLD = 50

export function calcDeliveryFee(subtotal: number): number {
  return subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE
}


