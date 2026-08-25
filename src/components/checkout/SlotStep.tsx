'use client'

import { Button } from '@/components/ui/Button'
import { ArrowRight } from 'lucide-react'
import { type CheckoutCtx } from '@/components/checkout/types'

const cn = (...c: (string | boolean | undefined)[]) => c.filter(Boolean).join(' ')

export default function SlotStep({ ctx, onNext, onBack }: { ctx: CheckoutCtx; onNext: () => void; onBack: () => void }) {
  const { days, slotLoading, selDate, setSelDate, selSlot, setSelSlot, selAvail } = ctx
  return (
    <div className="w-full">
      <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8 md:p-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Choose Delivery Slot</h1>
        <p className="text-gray-600 mb-8">Select a date and time that suits you.</p>

        {slotLoading && (
          <div className="flex items-center gap-3 text-gray-600">
            <div className="w-5 h-5 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
            Loading available slots...
          </div>
        )}

        {!slotLoading &&
          days.map((day) => (
            <div key={day.date} className="mb-6 last:mb-0">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">{day.label}</h3>
              {day.dayClosed && <p className="text-sm text-red-600 mb-2">This date is closed for delivery.</p>}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {day.slots.map((slot) => {
                  const sel = selDate === day.date && selSlot === slot.label
                  return (
                    <button
                      key={slot.id ?? slot.label}
                      type="button"
                      disabled={!slot.available}
                      onClick={() => { setSelDate(day.date); setSelSlot(slot.label) }}
                      className={cn(
                        'flex flex-col items-start p-4 border-2 rounded-xl text-left transition-all',
                        !slot.available ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed' : sel ? 'border-[var(--primary)] bg-[var(--primary)]/5 ring-2 ring-[var(--primary)]' : 'border-gray-200 hover:border-gray-300'
                      )}
                    >
                      <span className="font-medium">{slot.label}</span>
                      {slot.available && slot.remaining !== null && (
                        <span className="text-xs mt-1 px-2 py-0.5 bg-green-100 text-green-800 rounded-full">{slot.remaining} left</span>
                      )}
                      {!slot.available && slot.remaining === 0 && (
                        <span className="text-xs mt-1 px-2 py-0.5 bg-red-100 text-red-800 rounded-full">Full</span>
                      )}
                    </button>
                  )
                })}
              </div>
              {day.slots.length === 0 && !day.dayClosed && <p className="text-sm text-gray-500">No slots available for this date.</p>}
            </div>
          ))}

        <div className="mt-8 flex justify-between pt-6 border-t border-gray-100">
          <button type="button" onClick={onBack} className="text-gray-600 hover:text-gray-900 font-medium">Back</button>
          <Button size="lg" onClick={onNext} disabled={!selDate || !selSlot || !selAvail}>
            Continue to Payment <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
