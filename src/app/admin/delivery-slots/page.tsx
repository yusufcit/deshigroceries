'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Pencil, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import toast from 'react-hot-toast'

type Slot = {
  id: string
  dayOfWeek: number
  startTime: string
  endTime: string
  maxOrders: number
  isActive: boolean
  label: string
}

type Override = { isClosed: boolean; maxOrders: number | null; note: string | null }

type SlotView = Slot & {
  booked: number
  reservations: number
  remaining: number | null
  isClosed: boolean
  override: Override | null
}

type UpcomingDay = {
  date: string
  label: string
  dayClosed: boolean
  dayNote: string | null
  slots: SlotView[]
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const inputCls =
  'w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent'
const labelCls = 'block text-sm font-medium text-gray-700 mb-1.5'
const timeRe = /^\d{2}:\d{2}$/

function slotLabel(start: string, end: string): string {
  return start.slice(0, 5) + '–' + end.slice(0, 5)
}

export default function DeliverySlotsAdminPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [schedule, setSchedule] = useState<Slot[]>([])
  const [upcoming, setUpcoming] = useState<UpcomingDay[]>([])
  const [days, setDays] = useState(7)
  const [showAdd, setShowAdd] = useState(false)
  const [editingSlot, setEditingSlot] = useState<Slot | null>(null)
  const [busy, setBusy] = useState(false)
  const [drafts, setDrafts] = useState<Record<string, { closed: boolean; max: string; note: string }>>({})
  const [form, setForm] = useState({
    dayOfWeek: 1,
    startTime: '09:00',
    endTime: '11:00',
    maxOrders: '8',
    isActive: true,
  })

  async function loadSlots() {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/admin/delivery-slots?days=${days}`)
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || 'Failed to load delivery slots')
      }
      const data = await res.json()
      setSchedule(data.schedule ?? [])
      setUpcoming(data.upcoming ?? [])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load delivery slots')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadSlots()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days])

  const byDay = useMemo(
    () => [0, 1, 2, 3, 4, 5, 6].map((day) => ({ day, slots: schedule.filter((s) => s.dayOfWeek === day) })),
    [schedule]
  )

  function openAdd(day: number) {
    setEditingSlot(null)
    setForm({ dayOfWeek: day, startTime: '09:00', endTime: '11:00', maxOrders: '8', isActive: true })
    setShowAdd(true)
  }

  function openEdit(slot: Slot) {
    setEditingSlot(slot)
    setForm({
      dayOfWeek: slot.dayOfWeek,
      startTime: slot.startTime.slice(0, 5),
      endTime: slot.endTime.slice(0, 5),
      maxOrders: String(slot.maxOrders),
      isActive: slot.isActive,
    })
    setShowAdd(true)
  }

  async function saveSlot(e: React.FormEvent) {
    e.preventDefault()
    if (!timeRe.test(form.startTime) || !timeRe.test(form.endTime)) {
      toast.error('Please enter both times in HH:MM.')
      return
    }
    setBusy(true)
    try {
      const payload: Record<string, unknown> = {
        day_of_week: Number(form.dayOfWeek),
        start_time: form.startTime,
        end_time: form.endTime,
        max_orders: Number(form.maxOrders),
        is_active: form.isActive,
      }
      if (editingSlot) payload.id = editingSlot.id
      const res = await fetch('/api/admin/delivery-slots', {
        method: editingSlot ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'Failed to save the slot')
      toast.success(editingSlot ? 'Slot updated' : 'Slot added')
      setShowAdd(false)
      setEditingSlot(null)
      loadSlots()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save the slot')
    } finally {
      setBusy(false)
    }
  }

  async function toggleActive(slot: Slot) {
    try {
      const res = await fetch('/api/admin/delivery-slots', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: slot.id, is_active: !slot.isActive }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'Failed to update the slot')
      toast.success(slot.isActive ? 'Slot disabled' : 'Slot enabled')
      loadSlots()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update the slot')
    }
  }

  async function deleteSlot(id: string) {
    if (!window.confirm('Delete this slot? Its bookings and overrides will also be removed.')) return
    try {
      const res = await fetch('/api/admin/delivery-slots', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'Failed to delete the slot')
      toast.success('Slot deleted')
      loadSlots()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete the slot')
    }
  }

  async function saveOverride(
    date: string,
    slotId: string | null,
    payload: { is_closed: boolean; max_orders: number | null; note?: string }
  ) {
    setBusy(true)
    try {
      const res = await fetch('/api/admin/delivery-slots/overrides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, slot_id: slotId, ...payload }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'Failed to save the override')
      toast.success('Override saved')
      loadSlots()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save the override')
    } finally {
      setBusy(false)
    }
  }

  async function removeOverride(date: string, slotId: string | null) {
    setBusy(true)
    try {
      const res = await fetch('/api/admin/delivery-slots/overrides', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, slot_id: slotId }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || 'Failed to remove the override')
      toast.success('Override removed')
      loadSlots()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove the override')
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Delivery Slots</h1>
              <p className="text-gray-600 mt-1">Admin-controlled weekly schedule, capacity and date overrides.</p>
            </div>
            <Link href="/admin" className="inline-flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-800">
              <ArrowLeft className="w-4 h-4" /> Dashboard
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {isLoading && schedule.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-gray-500">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)] mb-3" />
            <span>Loading delivery slots…</span>
          </div>
        ) : (
          <>
            {/* ───────────── Weekly schedule ───────────── */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Weekly schedule</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Recurring windows, repeated every week. Disabled slots are hidden from customers.
                  </p>
                </div>
                <Button onClick={() => openAdd(new Date().getDay())}>
                  <Plus className="w-4 h-4 mr-2" /> Add slot
                </Button>
              </div>

              <div className="grid lg:grid-cols-2 gap-4">
                {byDay.map(({ day, slots }) => (
                  <div key={day} className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-gray-900 capitalize">{DAY_NAMES[day]}</h3>
                      <Button size="sm" variant="ghost" onClick={() => openAdd(day)}>
                        <Plus className="w-3.5 h-3.5" /> Add
                      </Button>
                    </div>
                    {slots.length === 0 ? (
                      <p className="text-sm text-gray-400 pb-2">No slots.</p>
                    ) : (
                      <div className="space-y-2">
                        {slots.map((slot) => (
                          <div
                            key={slot.id}
                            className={`flex items-center justify-between rounded-lg border p-3 transition-opacity ${
                              slot.isActive ? 'bg-white border-gray-200' : 'bg-white border-gray-200 opacity-60'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span
                                className={`w-2 h-2 rounded-full ${slot.isActive ? 'bg-green-500' : 'bg-gray-300'}`}
                              />
                              <div>
                                <p className="font-semibold text-gray-900 text-sm">{slot.label}</p>
                                <p className="text-xs text-gray-500">{slot.maxOrders} max orders</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button size="sm" variant="ghost" onClick={() => toggleActive(slot)}>
                                {slot.isActive ? 'Disable' : 'Enable'}
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => openEdit(slot)}>
                                <Pencil className="w-3.5 h-3.5" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => deleteSlot(slot.id)}>
                                <Trash2 className="w-3.5 h-3.5 text-red-500" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* ───────────── Upcoming days: capacity + overrides ───────────── */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Upcoming days</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Confirmed + active card reservations vs capacity, plus date-specific overrides for the next {days} days.
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={() => setDays(days === 7 ? 14 : 7)}>
                  Show {days === 7 ? '14' : '7'} days
                </Button>
              </div>

              {upcoming.length === 0 ? (
                <p className="text-sm text-gray-500">No upcoming days.</p>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {upcoming.map((day) => (
                    <div
                      key={day.date}
                      className={`rounded-xl border p-4 ${
                        day.dayClosed ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-bold text-gray-900">{day.label}</p>
                          {day.dayClosed ? (
                            <span className="text-xs font-semibold text-red-600 mt-0.5 inline-block">
                              Closed · {day.dayNote || 'no deliveries'}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-500 mt-0.5 inline-block">Normal schedule</span>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        {day.slots.length === 0 && (
                          <p className="text-sm text-gray-400">No active slots this day.</p>
                        )}
                        {day.slots.map((s) => {
                          const key = `${day.date}|${s.id}`
                          const dClosed = drafts[key]?.closed ?? s.isClosed
                          const dMax = drafts[key]?.max ?? String(s.maxOrders)
                          const dNote = drafts[key]?.note ?? s.override?.note ?? ''
  return (
                            <div
                              key={s.id}
                              className={`rounded-lg border p-3 ${
                                s.isClosed ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className={`font-semibold text-sm ${s.isClosed ? 'text-red-700' : 'text-gray-900'}`}>
                                    {s.label}
                                    {s.isClosed && <span className="ml-2 text-xs font-bold text-red-600">CLOSED</span>}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-0.5">
                                    {s.booked}/{s.maxOrders} confirmed
                                    {s.reservations > 0 && ` · ${s.reservations} card reserved`}
                                    {s.remaining !== null && ` · ${s.remaining} available`}
                                    {s.override?.maxOrders != null && ' · overridden'}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
                                    <input
                                      type="checkbox"
                                      checked={dClosed}
                                      onChange={(e) =>
                                        setDrafts({ ...drafts, [key]: { closed: e.target.checked, max: dMax, note: dNote } })
                                      }
                                    />
                                    Closed
                                  </label>
                                  <input
                                    type="number"
                                    min={0}
                                    className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                                    value={dMax}
                                    onChange={(e) =>
                                      setDrafts({ ...drafts, [key]: { closed: dClosed, max: e.target.value, note: dNote } })
                                    }
                                    title="Override max orders for this date (blank = keep schedule)"
                                  />
                                </div>
                              </div>
                              <div className="mt-2 flex items-center gap-2">
                                <input
                                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
                                  placeholder="Note (e.g. staff shortage)"
                                  value={dNote}
                                  onChange={(e) =>
                                    setDrafts({ ...drafts, [key]: { closed: dClosed, max: dMax, note: e.target.value } })
                                  }
                                />
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    saveOverride(day.date, s.id, {
                                      is_closed: dClosed,
                                      max_orders: dMax === '' ? null : Number(dMax),
                                      note: dNote.trim() || undefined,
                                    })
                                  }
                                >
                                  Save
                                </Button>
                                {s.override && (
                                  <Button size="sm" variant="outline" onClick={() => removeOverride(day.date, s.id)}>
                                    Reset
                                  </Button>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>

                      <div className="mt-3 flex items-center justify-between pt-3 border-t border-gray-200">
                        <input
                          className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm mr-2"
                          placeholder="Close whole day (Eid, Christmas, bank holiday)…"
                          value={drafts[day.date]?.note ?? day.dayNote ?? ''}
                          onChange={(e) =>
                            setDrafts({
                              ...drafts,
                              [day.date]: { closed: day.dayClosed, max: '', note: e.target.value },
                            })
                          }
                        />
                        {day.dayClosed ? (
                          <Button size="sm" variant="outline" onClick={() => removeOverride(day.date, null)}>
                            Reopen day
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() =>
                              saveOverride(day.date, null, {
                                is_closed: true,
                                max_orders: null,
                                note: (drafts[day.date]?.note || '').trim() || undefined,
                              })
                            }
                          >
                            Close day
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ───────────── Add / Edit slot modal ───────────── */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => !busy && setShowAdd(false)}>
          <form
            onSubmit={saveSlot}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4"
          >
            <h3 className="text-xl font-bold text-gray-900">{editingSlot ? 'Edit slot' : 'Add delivery slot'}</h3>

            <div>
              <label className={labelCls}>Day</label>
              <select
                className={inputCls}
                value={form.dayOfWeek}
                onChange={(e) => setForm({ ...form, dayOfWeek: Number(e.target.value) })}
              >
                {DAY_NAMES.map((name, i) => (
                  <option key={i} value={i}>{name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Start time</label>
                <input
                  type="time"
                  className={inputCls}
                  value={form.startTime}
                  onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className={labelCls}>End time</label>
                <input
                  type="time"
                  className={inputCls}
                  value={form.endTime}
                  onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <label className={labelCls}>Max orders per slot</label>
              <input
                type="number"
                min={1}
                className={inputCls}
                value={form.maxOrders}
                onChange={(e) => setForm({ ...form, maxOrders: e.target.value })}
                required
              />
            </div>

            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              />
              Active (available to customers)
            </label>

            <div className="flex gap-3 pt-2">
              <Button type="submit" isLoading={busy} className="flex-1">
                {editingSlot ? 'Save changes' : 'Add slot'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowAdd(false)} disabled={busy}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}