import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AdminCustomersPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?next=/admin/customers')

  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('*')
    .eq('id', user.id)
    .eq('is_active', true)
    .single()

  if (!adminUser) redirect('/')

  const { data: customers } = await supabase
    .from('customers')
    .select('*')
    .order('created_at', { ascending: false })

  const { data: ordersData } = await supabase
    .from('orders')
    .select('customer_id, customer_email')

  const orderCounts: Record<string, number> = {}
  if (ordersData) {
    ordersData.forEach((order: { customer_id: string | null; customer_email: string }) => {
      const key = order.customer_id || order.customer_email
      orderCounts[key] = (orderCounts[key] || 0) + 1
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-600 mt-1">View customer list</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Name</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Email</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Phone</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Orders</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Joined</th>
                </tr>
              </thead>
              <tbody>
                {customers && customers.length > 0 ? (
                  customers.map((customer: any) => (
                    <tr key={customer.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-900">{customer.full_name || 'N/A'}</td>
                      <td className="py-3 px-4 text-gray-600">{customer.email}</td>
                      <td className="py-3 px-4 text-gray-600">{customer.phone || 'N/A'}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                          {orderCounts[customer.id] || 0} orders
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {new Date(customer.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-500">
                      No customers found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}