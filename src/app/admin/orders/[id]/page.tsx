import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { MarkPaidButton } from './MarkPaidButton'

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?next=/admin/orders')
  const { data: adminUser } = await supabase
    .from('admin_users').select('id').eq('id', user.id).eq('is_active', true).single()
  if (!adminUser) redirect('/')
  const { data: order } = await supabase
    .from('orders').select('*').eq('id', id).single()
  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Order Not Found</h1>
          <Link href="/admin/orders" className="text-[var(--primary)] hover:underline">Back to Orders</Link>
        </div>
      </div>
    )
  }
  const { data: orderItems } = await supabase
    .from('order_items').select('*').eq('order_id', id)
  const isPOD = order.payment_method === 'pay_on_delivery'

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-5">
          <Link href="/admin/orders" className="text-sm text-[var(--primary)] hover:underline">&larr; Back to Orders</Link>
          <div className="flex items-center justify-between mt-2">
            <h1 className="text-3xl font-bold">Order #{order.order_number}</h1>
            <StatusBadge status={order.status} />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-5">
        <Card title="Customer">
          <div className="grid md:grid-cols-3 gap-4">
            <LV label="Name" value={order.customer_name} />
            <LV label="Email" value={order.customer_email} />
            <LV label="Phone" value={order.customer_phone || '\u2014'} />
          </div>
          <LV label="Type" value={order.customer_id ? 'Registered' : 'Guest'} />
        </Card>

        <Card title="Delivery">
          <div className="grid md:grid-cols-2 gap-4">
            <LV label="Date" value={order.delivery_date ? new Date(order.delivery_date + 'T00:00:00Z').toLocaleDateString('en-IE', { weekday:'short', day:'numeric', month:'short', year:'numeric', timeZone:'UTC' }) : '\u2014'} />
            <LV label="Slot" value={order.delivery_slot || '\u2014'} />
          </div>
          <LV label="Address" value={[order.delivery_address_line1, order.delivery_address_line2, order.delivery_city + (order.delivery_county ? ', ' + order.delivery_county : ''), order.delivery_eircode].filter(Boolean).join(', ')} />
          {order.delivery_instructions && <div className="mt-3 p-3 bg-gray-50 rounded text-sm text-gray-600"><span className="font-medium">Note:</span> {order.delivery_instructions}</div>}
        </Card>

        <Card title="Products">
          <table className="w-full text-sm">
            <thead><tr className="border-b text-gray-500"><th className="text-left py-2 pr-2 font-medium">Product</th><th className="text-center py-2 px-2 font-medium">Qty</th><th className="text-right py-2 px-2 font-medium">Unit Price</th><th className="text-right py-2 pl-2 font-medium">Total</th></tr></thead>
            <tbody>{(orderItems ?? []).map((it: any) => (
              <tr key={it.id} className="border-b last:border-0">
                <td className="py-2 pr-2"><span className="text-gray-900">{it.product_name}</span>{it.weight_option ? <span className="text-gray-500 ml-1">({it.weight_option})</span> : null}</td>
                <td className="py-2 px-2 text-center">{it.quantity}</td>
                <td className="py-2 px-2 text-right">&euro;{it.unit_price?.toFixed(2)}</td>
                <td className="py-2 pl-2 text-right font-medium">&euro;{it.total_price?.toFixed(2)}</td>
              </tr>
            ))}</tbody>
          </table>
        </Card>

        <Card title="Financial Summary">
          <div className="max-w-xs ml-auto space-y-2">
            <Row label="Subtotal" value={'\u20AC' + order.subtotal?.toFixed(2)} />
            <Row label="Delivery" value={order.delivery_fee === 0 ? 'FREE' : '\u20AC' + order.delivery_fee?.toFixed(2)} />
            <div className="flex justify-between text-lg font-bold border-t pt-2"><span className="text-gray-600">Total</span><span className="text-[var(--primary)]">&euro;{order.total?.toFixed(2)}</span></div>
          </div>
        </Card>

        <Card title="Payment">
          <div className="grid md:grid-cols-3 gap-4">
            <LV label="Method" value={isPOD ? 'Pay on Delivery' : 'Card'} />
            <LV label="Status" value={order.payment_status} />
            <LV label="Paid At" value={order.paid_at ? new Date(order.paid_at).toLocaleString('en-IE') : '\u2014'} />
          </div>
          {isPOD && order.payment_status === 'pending' && (
            <div className="mt-5 pt-4 border-t border-gray-200">
              <div className="flex items-center gap-4 flex-wrap">
                <p className="text-sm text-gray-600">Pay on Delivery &mdash; mark as <strong>Paid</strong> when payment is collected.</p>
                <MarkPaidButton orderId={order.id} />
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5"><h2 className="text-lg font-bold text-gray-900 mb-4">{title}</h2>{children}</div>
}

function LV({ label, value }: { label: string; value: string }) {
  return <div><span className="text-xs font-medium text-gray-500 uppercase">{label}</span><p className="text-gray-900 mt-0.5">{value}</p></div>
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between text-sm"><span className="text-gray-600">{label}</span><span className="text-gray-900">{value}</span></div>
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = { pending:'bg-yellow-100 text-yellow-800', processing:'bg-blue-100 text-blue-800', out_for_delivery:'bg-purple-100 text-purple-800', delivered:'bg-green-100 text-green-800', cancelled:'bg-red-100 text-red-800' }
  return <span className={'px-3 py-1.5 text-xs font-semibold rounded-full ' + (colors[status] || 'bg-gray-100')}>{status?.replace(/_/g, ' ')}</span>
}