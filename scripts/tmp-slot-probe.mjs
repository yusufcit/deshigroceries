import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.log('NO_CREDS')
  process.exit(0)
}

const sb = createClient(url, key, { auth: { persistSession: false } })

for (const t of ['delivery_slots', 'delivery_slot_overrides', 'delivery_slot_bookings']) {
  const { error } = await sb.from(t).select('*').limit(1)
  console.log(t, error ? 'MISSING: ' + error.message : 'EXISTS')
}

const { data: ordCols } = await sb
  .from('orders')
  .select('id, delivery_date, delivery_slot, delivery_slot_id')
  .limit(1)
console.log('orders delivery cols:', ordCols ? 'PRESENT' : 'colName error ->')

const { data: sched } = await sb
  .from('delivery_slots')
  .select('day_of_week, start_time, end_time, max_orders, is_active')
  .order('day_of_week')
  .order('display_order')
  .limit(40)
console.log('SCHEDULE_COUNT:', (sched || []).length)
console.log('SCHED:', JSON.stringify(sched).slice(0, 1200))

process.exit(0)