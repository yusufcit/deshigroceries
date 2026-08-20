import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AdminSettingsPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('*')
    .eq('id', user.id)
    .eq('is_active', true)
    .single()

  if (!adminUser) redirect('/')

  const { data: settings } = await supabase
    .from('site_settings')
    .select('*')

  const settingsMap: Record<string, any> = {}
  if (settings) {
    settings.forEach((s: any) => {
      settingsMap[s.setting_key] = s.setting_value
    })
  }

  const general = settingsMap.general || {}
  const delivery = settingsMap.delivery || {}
  const businessHours = settingsMap.business_hours || {}

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">Site configuration</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* General Settings */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">General</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Site Name</label>
              <p className="text-gray-900">{general.site_name || 'N/A'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tagline</label>
              <p className="text-gray-900">{general.tagline || 'N/A'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
              <p className="text-gray-900">{general.contact_email || 'N/A'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
              <p className="text-gray-900">{general.contact_phone || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Delivery Settings */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Delivery</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Default Delivery Fee</label>
              <p className="text-gray-900">€{delivery.default_fee?.toFixed(2) || '0.00'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Free Delivery Threshold</label>
              <p className="text-gray-900">€{delivery.free_delivery_threshold?.toFixed(2) || '0.00'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Order</label>
              <p className="text-gray-900">€{delivery.minimum_order?.toFixed(2) || '0.00'}</p>
            </div>
          </div>
        </div>

        {/* Business Hours */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Business Hours</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
              <div key={day} className="flex justify-between items-center py-2 border-b last:border-0">
                <span className="font-medium text-gray-700 capitalize">{day}</span>
                <span className="text-gray-900">{businessHours[day] || 'Closed'}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center text-sm text-gray-500">
          Settings can be updated directly in your Supabase database via the site_settings table.
        </div>
      </div>
    </div>
  )
}