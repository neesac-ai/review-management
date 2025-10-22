'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Building2, MapPin, Palette, Mail } from 'lucide-react'
import toast from 'react-hot-toast'

interface Business {
  id: string
  name: string
  description: string
  logo_url: string
  primary_color: string
  secondary_color: string
  google_place_id: string
  email_notifications: boolean
  notification_email: string
}

export default function SettingsPage() {
  const [businesses, setBusinesses] = useState<any[]>([])
  const [selectedBusiness, setSelectedBusiness] = useState('')
  const [loading, setLoading] = useState(false)
  const [businessData, setBusinessData] = useState<Partial<Business>>({
    name: '',
    description: '',
    logo_url: '',
    primary_color: '#2e9cca',
    secondary_color: '#4a4a66',
    google_place_id: '',
    email_notifications: true,
    notification_email: ''
  })

  const router = useRouter()

  useEffect(() => {
    checkAuth()
    fetchBusinesses()
  }, [])

  useEffect(() => {
    if (selectedBusiness) {
      fetchBusinessData()
    }
  }, [selectedBusiness])

  const checkAuth = () => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
    }
  }

  const fetchBusinesses = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/business`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      const data = await response.json()
      if (data.success) {
        setBusinesses(data.data)
        if (data.data.length > 0) {
          setSelectedBusiness(data.data[0].id)
        }
      }
    } catch (error) {
      toast.error('Failed to load businesses')
    }
  }

  const fetchBusinessData = async () => {
    if (!selectedBusiness) return
    
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/business/${selectedBusiness}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      const data = await response.json()
      if (data.success) {
        setBusinessData({
          name: data.data.name || '',
          description: data.data.description || '',
          logo_url: data.data.logo_url || '',
          primary_color: data.data.primary_color || '#2e9cca',
          secondary_color: data.data.secondary_color || '#4a4a66',
          google_place_id: data.data.google_place_id || '',
          email_notifications: data.data.email_notifications ?? true,
          notification_email: data.data.notification_email || ''
        })
      }
    } catch (error) {
      console.error('Failed to load business data:', error)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBusiness) return

    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/business/${selectedBusiness}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(businessData)
      })

      const data = await response.json()
      
      if (data.success) {
        toast.success('Business settings saved successfully!')
        fetchBusinesses()
      } else {
        toast.error(data.error || 'Failed to save settings')
      }
    } catch (error) {
      toast.error('Failed to save settings')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-light">
      {/* Header */}
      <div className="header-gradient border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center">
            <button
              onClick={() => router.back()}
              className="mr-4 p-2 hover:bg-white/50 rounded-md"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold text-gray-text">Business Settings</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Business Selector */}
        <div className="card mb-6">
          <h3 className="text-lg font-semibold text-gray-text mb-4">Select Business</h3>
          <select
            value={selectedBusiness}
            onChange={(e) => setSelectedBusiness(e.target.value)}
            className="input-field max-w-md"
          >
            <option value="">Select a business</option>
            {businesses.map((business) => (
              <option key={business.id} value={business.id}>
                {business.name}
              </option>
            ))}
          </select>
        </div>

        {/* Settings Form */}
        {selectedBusiness && (
          <form onSubmit={handleSave} className="space-y-6">
            {/* Basic Information */}
            <div className="card">
              <div className="flex items-center mb-4">
                <Building2 className="w-5 h-5 mr-2 text-primary" />
                <h3 className="text-lg font-semibold text-gray-text">Basic Information</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-text mb-2">
                    Business Name
                  </label>
                  <input
                    type="text"
                    value={businessData.name}
                    onChange={(e) => setBusinessData({...businessData, name: e.target.value})}
                    className="input-field"
                    placeholder="Your Business Name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-text mb-2">
                    Description
                  </label>
                  <textarea
                    value={businessData.description}
                    onChange={(e) => setBusinessData({...businessData, description: e.target.value})}
                    className="input-field h-24 resize-none"
                    placeholder="Brief description of your business"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-text mb-2">
                    Logo URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={businessData.logo_url}
                    onChange={(e) => setBusinessData({...businessData, logo_url: e.target.value})}
                    className="input-field"
                    placeholder="https://example.com/logo.png"
                  />
                  <p className="text-xs text-gray-muted mt-1">
                    URL to your business logo (will be shown to customers)
                  </p>
                </div>
              </div>
            </div>

            {/* Google Integration */}
            <div className="card">
              <div className="flex items-center mb-4">
                <MapPin className="w-5 h-5 mr-2 text-primary" />
                <h3 className="text-lg font-semibold text-gray-text">Google Integration</h3>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-text mb-2">
                  Google Place ID
                </label>
                <input
                  type="text"
                  value={businessData.google_place_id}
                  onChange={(e) => setBusinessData({...businessData, google_place_id: e.target.value})}
                  className="input-field"
                  placeholder="ChIJN1t_tDeuEmsRUsoyG83frY4"
                />
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-gray-text mb-2">
                    <strong>How to find your Google Place ID:</strong>
                  </p>
                  <ol className="text-sm text-gray-muted space-y-1 ml-4 list-decimal">
                    <li>Go to <a href="https://developers.google.com/maps/documentation/places/web-service/place-id" target="_blank" className="text-primary underline">Google Place ID Finder</a></li>
                    <li>Search for your business</li>
                    <li>Copy the Place ID (starts with "ChIJ")</li>
                    <li>Paste it here</li>
                  </ol>
                  <p className="text-xs text-gray-muted mt-2">
                    This enables the "Open Google Reviews" button to link directly to your Google Business page
                  </p>
                </div>
              </div>
            </div>

            {/* Branding */}
            <div className="card">
              <div className="flex items-center mb-4">
                <Palette className="w-5 h-5 mr-2 text-primary" />
                <h3 className="text-lg font-semibold text-gray-text">Branding & Colors</h3>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-text mb-2">
                    Primary Color
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={businessData.primary_color}
                      onChange={(e) => setBusinessData({...businessData, primary_color: e.target.value})}
                      className="h-10 w-20 rounded border border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={businessData.primary_color}
                      onChange={(e) => setBusinessData({...businessData, primary_color: e.target.value})}
                      className="input-field flex-1"
                      placeholder="#2e9cca"
                    />
                  </div>
                  <p className="text-xs text-gray-muted mt-1">
                    Used for buttons and QR codes
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-text mb-2">
                    Secondary Color
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={businessData.secondary_color}
                      onChange={(e) => setBusinessData({...businessData, secondary_color: e.target.value})}
                      className="h-10 w-20 rounded border border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={businessData.secondary_color}
                      onChange={(e) => setBusinessData({...businessData, secondary_color: e.target.value})}
                      className="input-field flex-1"
                      placeholder="#4a4a66"
                    />
                  </div>
                  <p className="text-xs text-gray-muted mt-1">
                    Used for accents and text
                  </p>
                </div>
              </div>

              <div className="mt-4 p-4 border border-gray-200 rounded-lg">
                <p className="text-sm font-medium text-gray-text mb-3">Preview:</p>
                <div className="flex items-center space-x-4">
                  <button
                    type="button"
                    style={{ backgroundColor: businessData.primary_color }}
                    className="px-4 py-2 text-white rounded-md font-medium"
                  >
                    Primary Button
                  </button>
                  <span style={{ color: businessData.secondary_color }} className="font-semibold">
                    Secondary Text
                  </span>
                </div>
              </div>
            </div>

            {/* Email Notifications */}
            <div className="card">
              <div className="flex items-center mb-4">
                <Mail className="w-5 h-5 mr-2 text-primary" />
                <h3 className="text-lg font-semibold text-gray-text">Email Notifications</h3>
              </div>

              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={businessData.email_notifications}
                    onChange={(e) => setBusinessData({...businessData, email_notifications: e.target.checked})}
                    className="mr-3 h-4 w-4 text-primary"
                  />
                  <label className="text-sm text-gray-text">
                    Enable email notifications for negative feedback
                  </label>
                </div>

                {businessData.email_notifications && (
                  <div>
                    <label className="block text-sm font-medium text-gray-text mb-2">
                      Notification Email
                    </label>
                    <input
                      type="email"
                      value={businessData.notification_email}
                      onChange={(e) => setBusinessData({...businessData, notification_email: e.target.value})}
                      className="input-field"
                      placeholder="notifications@yourbusiness.com"
                    />
                    <p className="text-xs text-gray-muted mt-1">
                      We'll send you an email when customers submit negative feedback
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex items-center px-8"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Settings
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

