'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  BarChart3, 
  MessageSquare, 
  QrCode, 
  Settings, 
  LogOut, 
  Plus,
  TrendingUp,
  Users,
  Star,
  Download
} from 'lucide-react'
import toast from 'react-hot-toast'
import { formatToIST, getRelativeTime } from '@/utils/timezone'

interface Business {
  id: string
  name: string
  description?: string
  logo_url?: string
  created_at: string
}

interface DashboardMetrics {
  totalScans: number
  thumbsUp: number
  thumbsDown: number
  copies: number
  feedbackSubmissions: number
  conversionRate: number
  positiveRate: number
  averageRating: number
  recentActivity: any[]
}

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [selectedBusiness, setSelectedBusiness] = useState<string>('')
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [exportLoading, setExportLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (selectedBusiness) {
      fetchMetrics()
    }
  }, [selectedBusiness])

  const checkAuth = () => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    
    if (!token || !userData) {
      router.push('/login')
      return
    }

    setUser(JSON.parse(userData))
    fetchBusinesses()
  }

  const fetchBusinesses = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/business`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
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
    } finally {
      setLoading(false)
    }
  }

  const fetchMetrics = async () => {
    if (!selectedBusiness) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/analytics/dashboard/${selectedBusiness}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      const data = await response.json()
      
      if (data.success) {
        setMetrics(data.data)
      }
    } catch (error) {
      console.error('Failed to load metrics:', error)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/login')
  }

  const handleExportAnalytics = async () => {
    if (!selectedBusiness) return
    
    setExportLoading(true)
    try {
      const token = localStorage.getItem('token')
      let url = `${process.env.NEXT_PUBLIC_API_URL}/api/analytics/export/${selectedBusiness}?format=csv`
      
      if (startDate) url += `&startDate=${startDate}`
      if (endDate) url += `&endDate=${endDate}`
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const downloadUrl = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = downloadUrl
        a.download = `analytics-${Date.now()}.csv`
        document.body.appendChild(a)
        a.click()
        a.remove()
        toast.success('Analytics exported successfully!')
      } else {
        toast.error('Failed to export analytics')
      }
    } catch (error) {
      toast.error('Failed to export analytics')
    } finally {
      setExportLoading(false)
    }
  }

  const handleExportFeedback = async () => {
    if (!selectedBusiness) return
    
    setExportLoading(true)
    try {
      const token = localStorage.getItem('token')
      let url = `${process.env.NEXT_PUBLIC_API_URL}/api/analytics/export-feedback/${selectedBusiness}?format=csv`
      
      if (startDate) url += `&startDate=${startDate}`
      if (endDate) url += `&endDate=${endDate}`
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const blob = await response.blob()
        const downloadUrl = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = downloadUrl
        a.download = `feedback-${Date.now()}.csv`
        document.body.appendChild(a)
        a.click()
        a.remove()
        toast.success('Feedback exported successfully!')
      } else {
        toast.error('Failed to export feedback')
      }
    } catch (error) {
      toast.error('Failed to export feedback')
    } finally {
      setExportLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-light flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-muted">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-light">
      {/* Header */}
      <div className="header-gradient border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold">
                <span className="text-primary-dark">neesac</span>
                <span className="text-primary">.ai</span>
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-gray-muted">Welcome, {user?.name}</span>
              <button
                onClick={handleLogout}
                className="btn-secondary flex items-center"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-text mb-4">Navigation</h3>
              <nav className="space-y-2">
                <Link href="/dashboard" className="flex items-center p-2 rounded-md bg-primary/10 text-primary">
                  <BarChart3 className="w-4 h-4 mr-3" />
                  Dashboard
                </Link>
                <Link href="/dashboard/playground-v2" className="flex items-center p-2 rounded-md text-gray-muted hover:bg-gray-50">
                  <MessageSquare className="w-4 h-4 mr-3" />
                  Review Playground
                </Link>
                <Link href="/dashboard/qr-generator" className="flex items-center p-2 rounded-md text-gray-muted hover:bg-gray-50">
                  <QrCode className="w-4 h-4 mr-3" />
                  QR Generator
                </Link>
                <Link href="/dashboard/analytics" className="flex items-center p-2 rounded-md text-gray-muted hover:bg-gray-50">
                  <BarChart3 className="w-4 h-4 mr-3" />
                  Analytics
                </Link>
                <Link href="/dashboard/feedback" className="flex items-center p-2 rounded-md text-gray-muted hover:bg-gray-50">
                  <Users className="w-4 h-4 mr-3" />
                  Feedback
                </Link>
                <Link href="/dashboard/ai-config" className="flex items-center p-2 rounded-md text-gray-muted hover:bg-gray-50">
                  <Settings className="w-4 h-4 mr-3" />
                  AI Configuration
                </Link>
                <Link href="/dashboard/settings" className="flex items-center p-2 rounded-md text-gray-muted hover:bg-gray-50">
                  <Settings className="w-4 h-4 mr-3" />
                  Settings
                </Link>
              </nav>
            </div>

            {/* Business Selector */}
            <div className="card mt-6">
              <h3 className="text-lg font-semibold text-gray-text mb-4">Business</h3>
              <select
                value={selectedBusiness}
                onChange={(e) => setSelectedBusiness(e.target.value)}
                className="input-field"
              >
                {businesses.map((business) => (
                  <option key={business.id} value={business.id}>
                    {business.name}
                  </option>
                ))}
              </select>
              <button className="btn-primary w-full mt-4 flex items-center justify-center">
                <Plus className="w-4 h-4 mr-2" />
                Add Business
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Metrics Cards */}
            {metrics && (
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="card">
                  <div className="flex items-center">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <QrCode className="w-6 h-6 text-primary" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-gray-muted">Total Scans</p>
                      <p className="text-2xl font-bold text-gray-text">{metrics.totalScans}</p>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="flex items-center">
                    <div className="p-2 bg-success/10 rounded-lg">
                      <TrendingUp className="w-6 h-6 text-success" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-gray-muted">% Google Reviews</p>
                      <p className="text-2xl font-bold text-gray-text">{metrics.googleReviewRate || 0}%</p>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="flex items-center">
                    <div className="p-2 bg-warning/10 rounded-lg">
                      <Star className="w-6 h-6 text-warning" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-gray-muted">% Internal Reviews</p>
                      <p className="text-2xl font-bold text-gray-text">{metrics.internalReviewRate || 0}%</p>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="flex items-center">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Users className="w-6 h-6 text-primary" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-gray-muted">Feedback</p>
                      <p className="text-2xl font-bold text-gray-text">{metrics.feedbackSubmissions}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-text mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <Link href="/dashboard/playground" className="btn-primary w-full flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Generate Reviews
                  </Link>
                  <Link href="/dashboard/qr-generator" className="btn-secondary w-full flex items-center justify-center">
                    <QrCode className="w-4 h-4 mr-2" />
                    Create QR Code
                  </Link>
                </div>
              </div>

              <div className="card">
                <h3 className="text-lg font-semibold text-gray-text mb-4">Recent Activity</h3>
                {metrics?.recentActivity && metrics.recentActivity.length > 0 ? (
                  <div className="space-y-2">
                    {metrics.recentActivity.slice(0, 5).map((activity, index) => {
                      const eventType = activity.type || activity.event_type || 'unknown';
                      const timestamp = activity.timestamp || activity.created_at;
                      return (
                        <div key={index} className="flex items-center text-sm">
                          <div className={`w-2 h-2 rounded-full mr-3 ${
                            eventType === 'scan' ? 'bg-primary' :
                            eventType === 'thumbs_up' ? 'bg-success' :
                            eventType === 'thumbs_down' ? 'bg-warning' :
                            'bg-gray-muted'
                          }`}></div>
                          <span className="text-gray-muted">
                            {eventType.replace('_', ' ')} - {timestamp ? formatToIST(timestamp) : 'N/A'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-muted">No recent activity</p>
                )}
              </div>
            </div>

            {/* Export Options */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-text mb-4">Export Data</h3>
              
              {/* Date Range Filter */}
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-text mb-2">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-text mb-2">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>

              {/* Export Buttons */}
              <div className="flex flex-wrap gap-3">
                <button 
                  onClick={handleExportAnalytics}
                  disabled={!selectedBusiness || exportLoading}
                  className="btn-secondary flex items-center"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {exportLoading ? 'Exporting...' : 'Export Analytics'}
                </button>
                <button 
                  onClick={handleExportFeedback}
                  disabled={!selectedBusiness || exportLoading}
                  className="btn-secondary flex items-center"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {exportLoading ? 'Exporting...' : 'Export Feedback'}
                </button>
              </div>
              
              {(startDate || endDate) && (
                <p className="text-sm text-gray-muted mt-2">
                  Exporting data {startDate && `from ${startDate}`} {endDate && `to ${endDate}`}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


