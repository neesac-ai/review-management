'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Download, TrendingUp, ThumbsUp, ThumbsDown, Copy, MessageSquare, Star, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'

interface AnalyticsData {
  totalScans: number
  thumbsUp: number
  thumbsDown: number
  copies: number
  feedbackSubmissions: number
  totalReviews: number
  googleReviews: number
  internalReviews: number
  googleAvgRating: number
  internalAvgRating: number
  conversionRate: number
  positiveRate: number
  averageRating: number
  recentActivity: any[]
}

export default function AnalyticsPage() {
  const [businesses, setBusinesses] = useState<any[]>([])
  const [selectedBusiness, setSelectedBusiness] = useState('')
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [exportLoading, setExportLoading] = useState(false)

  const router = useRouter()

  useEffect(() => {
    checkAuth()
    fetchBusinesses()
  }, [])

  useEffect(() => {
    if (selectedBusiness) {
      fetchAnalytics()
    }
  }, [selectedBusiness, startDate, endDate])

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
    } finally {
      setLoading(false)
    }
  }

  const fetchAnalytics = async () => {
    if (!selectedBusiness) return
    
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      let url = `${process.env.NEXT_PUBLIC_API_URL}/api/analytics/dashboard/${selectedBusiness}`
      
      const params = new URLSearchParams()
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)
      
      if (params.toString()) {
        url += `?${params.toString()}`
      }
      
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      const data = await response.json()
      if (data.success) {
        setAnalytics(data.data)
      } else {
        toast.error(data.error || 'Failed to load analytics')
      }
    } catch (error) {
      console.error('Failed to load analytics:', error)
      toast.error('Failed to load analytics')
    } finally {
      setLoading(false)
    }
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

  if (loading && !analytics) {
    return (
      <div className="min-h-screen bg-gray-light flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-muted">Loading analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-light">
      {/* Header */}
      <div className="header-gradient border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => router.back()}
                className="mr-4 p-2 hover:bg-white/50 rounded-md"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-2xl font-bold text-gray-text">Analytics Dashboard</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Business Selector and Filters */}
        <div className="card mb-6">
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-text mb-2">
                Select Business
              </label>
              <select
                value={selectedBusiness}
                onChange={(e) => setSelectedBusiness(e.target.value)}
                className="input-field"
              >
                <option value="">Select a business</option>
                {businesses.map((business) => (
                  <option key={business.id} value={business.id}>
                    {business.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-text mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-text mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="input-field"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setStartDate('')
                  setEndDate('')
                }}
                className="btn-neutral w-full"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {analytics && (
          <>
            {/* Summary Cards */}
            <div className="grid md:grid-cols-4 gap-6 mb-6">
              <div className="card">
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <span className="text-xs text-gray-muted">Total Scans</span>
                </div>
                <p className="text-3xl font-bold text-gray-text">{analytics.totalScans}</p>
                <p className="text-sm text-gray-muted mt-1">QR Code Scans</p>
              </div>

              <div className="card">
                <div className="flex items-center justify-between mb-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  <span className="text-xs text-gray-muted">Avg Rating</span>
                </div>
                <p className="text-3xl font-bold text-gray-text">{analytics.averageRating.toFixed(1)}</p>
                <p className="text-sm text-gray-muted mt-1">Overall Rating</p>
              </div>

              <div className="card">
                <div className="flex items-center justify-between mb-2">
                  <ThumbsUp className="w-5 h-5 text-green-500" />
                  <span className="text-xs text-gray-muted">Conversion</span>
                </div>
                <p className="text-3xl font-bold text-gray-text">{analytics.conversionRate}%</p>
                <p className="text-sm text-gray-muted mt-1">To Google Reviews</p>
              </div>

              <div className="card">
                <div className="flex items-center justify-between mb-2">
                  <MessageSquare className="w-5 h-5 text-blue-500" />
                  <span className="text-xs text-gray-muted">Total Reviews</span>
                </div>
                <p className="text-3xl font-bold text-gray-text">{analytics.totalReviews}</p>
                <p className="text-sm text-gray-muted mt-1">All Platforms</p>
              </div>
            </div>

            {/* Review Breakdown */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-text mb-4 flex items-center">
                  <ThumbsUp className="w-5 h-5 mr-2 text-green-500" />
                  Google Reviews
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-muted">Total Reviews</span>
                    <span className="text-xl font-bold text-gray-text">{analytics.googleReviews}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-muted">Average Rating</span>
                    <span className="text-xl font-bold text-gray-text">
                      <Star className="w-5 h-5 inline text-yellow-500" />
                      {analytics.googleAvgRating.toFixed(1)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-muted">Review Copies</span>
                    <span className="text-xl font-bold text-gray-text">{analytics.copies}</span>
                  </div>
                </div>
              </div>

              <div className="card">
                <h3 className="text-lg font-semibold text-gray-text mb-4 flex items-center">
                  <ThumbsDown className="w-5 h-5 mr-2 text-orange-500" />
                  Internal Feedback
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-muted">Total Feedback</span>
                    <span className="text-xl font-bold text-gray-text">{analytics.internalReviews}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-muted">Average Rating</span>
                    <span className="text-xl font-bold text-gray-text">
                      <Star className="w-5 h-5 inline text-yellow-500" />
                      {analytics.internalAvgRating.toFixed(1)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-muted">Feedback Submissions</span>
                    <span className="text-xl font-bold text-gray-text">{analytics.feedbackSubmissions}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Engagement Stats */}
            <div className="card mb-6">
              <h3 className="text-lg font-semibold text-gray-text mb-4">Customer Engagement</h3>
              <div className="grid md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <ThumbsUp className="w-8 h-8 mx-auto text-green-600 mb-2" />
                  <p className="text-2xl font-bold text-gray-text">{analytics.thumbsUp}</p>
                  <p className="text-sm text-gray-muted">Thumbs Up</p>
                </div>

                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <ThumbsDown className="w-8 h-8 mx-auto text-orange-600 mb-2" />
                  <p className="text-2xl font-bold text-gray-text">{analytics.thumbsDown}</p>
                  <p className="text-sm text-gray-muted">Thumbs Down</p>
                </div>

                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <Copy className="w-8 h-8 mx-auto text-blue-600 mb-2" />
                  <p className="text-2xl font-bold text-gray-text">{analytics.copies}</p>
                  <p className="text-sm text-gray-muted">Review Copies</p>
                </div>

                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <MessageSquare className="w-8 h-8 mx-auto text-purple-600 mb-2" />
                  <p className="text-2xl font-bold text-gray-text">{analytics.positiveRate.toFixed(1)}%</p>
                  <p className="text-sm text-gray-muted">Positive Rate</p>
                </div>
              </div>
            </div>

            {/* Export Options */}
            <div className="card mb-6">
              <h3 className="text-lg font-semibold text-gray-text mb-4">Export Data</h3>
              <div className="flex gap-4">
                <button
                  onClick={handleExportAnalytics}
                  disabled={exportLoading}
                  className="btn-primary flex items-center"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {exportLoading ? 'Exporting...' : 'Export Analytics'}
                </button>
                <button
                  onClick={handleExportFeedback}
                  disabled={exportLoading}
                  className="btn-neutral flex items-center"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {exportLoading ? 'Exporting...' : 'Export Feedback'}
                </button>
              </div>
              <p className="text-sm text-gray-muted mt-2">
                Download CSV files with {startDate || endDate ? 'filtered' : 'all'} data for analysis
              </p>
            </div>

            {/* Recent Activity */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-text mb-4">Recent Activity</h3>
              <div className="space-y-2">
                {analytics.recentActivity.length > 0 ? (
                  analytics.recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                      <div className="flex items-center">
                        {activity.type === 'scan' && <TrendingUp className="w-4 h-4 mr-2 text-blue-500" />}
                        {activity.type === 'thumbs_up' && <ThumbsUp className="w-4 h-4 mr-2 text-green-500" />}
                        {activity.type === 'thumbs_down' && <ThumbsDown className="w-4 h-4 mr-2 text-orange-500" />}
                        {activity.type === 'copy_review' && <Copy className="w-4 h-4 mr-2 text-purple-500" />}
                        {activity.type === 'submit_feedback' && <MessageSquare className="w-4 h-4 mr-2 text-red-500" />}
                        <span className="text-sm text-gray-text capitalize">{activity.type.replace('_', ' ')}</span>
                      </div>
                      <span className="text-xs text-gray-muted">
                        {new Date(activity.timestamp).toLocaleString()}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-muted py-8">No recent activity</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

