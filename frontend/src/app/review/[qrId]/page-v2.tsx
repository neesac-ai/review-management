'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { ThumbsUp, ThumbsDown, Star, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { apiUrl } from '@/utils/api'

interface Business {
  id: string
  name: string
  description: string
  logo_url?: string
  primary_color: string
  secondary_color: string
  google_place_id?: string
}

interface Template {
  id: string
  content: string
  word_count: number
  is_manual: boolean
}

interface Category {
  id: string
  name: string
  description: string
  review_templates: Template[]
}

export default function ReviewPageV2() {
  const params = useParams()
  const qrId = params.qrId as string
  
  const [business, setBusiness] = useState<Business | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'choice' | 'reviews' | 'feedback'>('choice')
  
  // Feedback form state
  const [feedbackData, setFeedbackData] = useState({
    rating: 3,
    content: '',
    additionalComments: ''
  })
  const [submittingFeedback, setSubmittingFeedback] = useState(false)

  useEffect(() => {
    if (qrId) {
      fetchBusinessInfo()
      trackScan()
    }
  }, [qrId])

  const fetchBusinessInfo = async () => {
    try {
      const response = await fetch(apiUrl(`/api/qr/${qrId}/info`))
      const data = await response.json()
      
      if (data.success) {
        setBusiness(data.data.business)
        
        // Fetch categories and templates
        const categoriesResponse = await fetch(apiUrl(`/api/reviews/by-category/${data.data.business.id}`))
        const categoriesData = await categoriesResponse.json()
        
        if (categoriesData.success) {
          setCategories(categoriesData.data)
          if (categoriesData.data.length > 0) {
            setSelectedCategory(categoriesData.data[0].id)
          }
        }
      } else {
        toast.error(data.error || 'QR code not found')
      }
    } catch (error) {
      console.error('Error fetching business info:', error)
      toast.error('Failed to load business information')
    } finally {
      setLoading(false)
    }
  }

  const trackScan = async () => {
    try {
      await fetch(apiUrl(`/api/qr/${qrId}/scan`), { method: 'POST' })
    } catch (error) {
      console.error('Failed to track scan:', error)
    }
  }

  const handleThumbsUp = async () => {
    try {
      await fetch(apiUrl(`/api/qr/${qrId}/track`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'thumbs_up' })
      })
      setView('reviews')
    } catch (error) {
      console.error('Failed to track thumbs up:', error)
      toast.error('Something went wrong')
    }
  }

  const handleThumbsDown = async () => {
    try {
      await fetch(apiUrl(`/api/qr/${qrId}/track`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'thumbs_down' })
      })
      setView('feedback')
    } catch (error) {
      console.error('Failed to track thumbs down:', error)
      toast.error('Something went wrong')
    }
  }

  const handleCopyAndPost = async (template: Template) => {
    try {
      // Copy to clipboard
      await navigator.clipboard.writeText(template.content)
      toast.success('Review copied to clipboard!')

      // Track copy event
      await fetch(apiUrl(`/api/qr/${qrId}/track`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'copy_review',
          reviewContent: template.content
        })
      })

      // Open Google Reviews
      if (business?.google_place_id) {
        // Track Google redirect
        await fetch(apiUrl(`/api/qr/${qrId}/track`), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'google_redirect' })
        })

        const googleUrl = `https://search.google.com/local/writereview?placeid=${business.google_place_id}`
        window.open(googleUrl, '_blank')
      } else {
        toast.error('Google Place ID not configured')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to copy review')
    }
  }

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmittingFeedback(true)

    try {
      const response = await fetch(apiUrl('/api/feedback/submit'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qrCodeId: qrId,
          rating: feedbackData.rating,
          content: feedbackData.content,
          additionalComments: feedbackData.additionalComments
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Thank you for your feedback!')
        
        // Track feedback submission
        await fetch(apiUrl(`/api/qr/${qrId}/track`), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'submit_feedback' })
        })

        // Reset form
        setFeedbackData({ rating: 3, content: '', additionalComments: '' })
        
        // Show success message for 2 seconds then reset
        setTimeout(() => {
          setView('choice')
        }, 2000)
      } else {
        toast.error(data.error || 'Failed to submit feedback')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to submit feedback')
    } finally {
      setSubmittingFeedback(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!business) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-text mb-2">QR Code Not Found</h1>
          <p className="text-gray-muted">This QR code is invalid or has been deleted.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div 
        className="py-8 px-4"
        style={{
          background: `linear-gradient(135deg, ${business.primary_color}15 0%, ${business.secondary_color}15 100%)`
        }}
      >
        <div className="max-w-4xl mx-auto text-center">
          {business.logo_url && (
            <img 
              src={business.logo_url} 
              alt={business.name}
              className="h-16 mx-auto mb-4"
            />
          )}
          <h1 className="text-3xl font-bold text-gray-text mb-2">{business.name}</h1>
          {business.description && (
            <p className="text-gray-muted">{business.description}</p>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Choice View - Thumbs Up/Down */}
        {view === 'choice' && (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-text mb-4">How was your experience?</h2>
            <p className="text-gray-muted mb-8">Your feedback helps us improve our services</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
              <button
                onClick={handleThumbsUp}
                className="group p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-green-500"
              >
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center group-hover:bg-green-500 transition-colors duration-300">
                  <ThumbsUp className="w-10 h-10 text-green-600 group-hover:text-white transition-colors duration-300" />
                </div>
                <h3 className="text-xl font-semibold text-gray-text mb-2">Great Experience!</h3>
                <p className="text-gray-muted">Share your positive experience</p>
              </button>

              <button
                onClick={handleThumbsDown}
                className="group p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-orange-500"
              >
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-orange-100 flex items-center justify-center group-hover:bg-orange-500 transition-colors duration-300">
                  <ThumbsDown className="w-10 h-10 text-orange-600 group-hover:text-white transition-colors duration-300" />
                </div>
                <h3 className="text-xl font-semibold text-gray-text mb-2">Needs Improvement</h3>
                <p className="text-gray-muted">Help us serve you better</p>
              </button>
            </div>
          </div>
        )}

        {/* Reviews View - Category Tabs & Templates */}
        {view === 'reviews' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-text mb-2 text-center">Choose a Review Template</h2>
            <p className="text-gray-muted mb-6 text-center">Select a category and click "Copy & Post" to share on Google</p>

            {categories.length > 0 ? (
              <>
                {/* Category Tabs */}
                <div className="flex flex-wrap gap-2 mb-6 justify-center">
                  {categories.map(category => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`px-6 py-3 rounded-full font-medium transition-all duration-300 ${
                        selectedCategory === category.id
                          ? 'bg-primary text-white shadow-lg'
                          : 'bg-white text-gray-text hover:bg-gray-100'
                      }`}
                      style={{
                        ...(selectedCategory === category.id && {
                          background: `linear-gradient(135deg, ${business.primary_color} 0%, ${business.secondary_color} 100%)`
                        })
                      }}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>

                {/* Templates Grid */}
                <div className="space-y-4">
                  {categories
                    .find(c => c.id === selectedCategory)
                    ?.review_templates.map((template) => (
                      <div
                        key={template.id}
                        className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow duration-300"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <span className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-600">
                            {template.word_count} words
                          </span>
                        </div>
                        <p className="text-gray-text mb-4 leading-relaxed">{template.content}</p>
                        <button
                          onClick={() => handleCopyAndPost(template)}
                          className="w-full py-3 rounded-lg font-semibold text-white transition-all duration-300 hover:shadow-lg"
                          style={{
                            background: `linear-gradient(135deg, ${business.primary_color} 0%, ${business.secondary_color} 100%)`
                          }}
                        >
                          Copy & Post
                        </button>
                      </div>
                    ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-muted">No review templates available yet.</p>
              </div>
            )}
          </div>
        )}

        {/* Feedback View - Google-style Form */}
        {view === 'feedback' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-bold text-gray-text mb-2 text-center">Share Your Feedback</h2>
              <p className="text-gray-muted mb-6 text-center">We value your opinion and will work to improve</p>

              <form onSubmit={handleSubmitFeedback}>
                {/* Star Rating */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-text mb-3 text-center">
                    How would you rate your experience?
                  </label>
                  <div className="flex items-center justify-center space-x-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFeedbackData({ ...feedbackData, rating: star })}
                        className="group focus:outline-none transition-transform hover:scale-110"
                      >
                        <Star
                          className={`w-12 h-12 ${
                            star <= feedbackData.rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          } transition-colors duration-200`}
                        />
                      </button>
                    ))}
                  </div>
                  <p className="text-center text-sm text-gray-muted mt-2">
                    {feedbackData.rating === 1 && 'Poor'}
                    {feedbackData.rating === 2 && 'Fair'}
                    {feedbackData.rating === 3 && 'Good'}
                    {feedbackData.rating === 4 && 'Very Good'}
                    {feedbackData.rating === 5 && 'Excellent'}
                  </p>
                </div>

                {/* Review Content */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-text mb-2">
                    Tell us about your experience *
                  </label>
                  <textarea
                    value={feedbackData.content}
                    onChange={(e) => setFeedbackData({ ...feedbackData, content: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                    rows={5}
                    placeholder="Share details of your experience..."
                    required
                  />
                </div>

                {/* Additional Comments */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-text mb-2">
                    Additional Comments (Optional)
                  </label>
                  <textarea
                    value={feedbackData.additionalComments}
                    onChange={(e) => setFeedbackData({ ...feedbackData, additionalComments: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                    rows={3}
                    placeholder="Any other feedback or suggestions..."
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submittingFeedback}
                  className="w-full py-4 rounded-lg font-semibold text-white transition-all duration-300 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${business.primary_color} 0%, ${business.secondary_color} 100%)`
                  }}
                >
                  {submittingFeedback ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Submit Feedback
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="py-6 text-center border-t border-gray-200 mt-12">
        <p className="text-sm text-gray-muted">
          Powered by{' '}
          <span className="font-semibold text-primary-dark">neesac</span>
          <span className="font-semibold text-primary">.ai</span>
        </p>
      </footer>
    </div>
  )
}

