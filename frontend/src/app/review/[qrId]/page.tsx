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
      // The GET /:qrCodeId endpoint returns business info AND tracks the scan automatically
      const response = await fetch(apiUrl(`/api/qr/${qrId}`))
      const data = await response.json()
      
      if (data.success) {
        // Backend returns businesses (from Supabase JOIN), extract it
        const businessData = data.data.businesses || data.data.business
        
        if (!businessData) {
          toast.error('Business information not found')
          return
        }
        
        setBusiness(businessData)
        
        // Fetch categories and templates
        const categoriesResponse = await fetch(apiUrl(`/api/reviews/by-category/${businessData.id}`))
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
    // Scan is already tracked by the fetchBusinessInfo call (GET /:qrCodeId)
    // No need for a separate scan tracking call
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

      // Track copy event with templateId for deletion and auto-regeneration
      await fetch(apiUrl(`/api/qr/${qrId}/track`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'copy_review',
          reviewContent: template.content,
          templateId: template.id
        })
      })

      // Refresh categories to get updated templates (after auto-regeneration)
      // Add a small delay to allow backend auto-regeneration to complete
      if (business) {
        setTimeout(async () => {
          try {
            const categoriesResponse = await fetch(apiUrl(`/api/reviews/by-category/${business.id}`))
            const categoriesData = await categoriesResponse.json()
            
            if (categoriesData.success) {
              setCategories(categoriesData.data)
            }
          } catch (refreshError) {
            console.error('Error refreshing categories:', refreshError)
          }
        }, 2000) // 2 second delay to allow auto-regeneration
      }

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

        {/* Feedback View - Exact Google Review Form Replica */}
        {view === 'feedback' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              {/* Header - Exact Google Style */}
              <div className="bg-white border-b border-gray-200 p-6">
                <div className="flex items-center space-x-4 mb-4">
                  {/* User Profile Picture - Google Style */}
                  <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white text-lg font-medium flex-shrink-0">
                    n
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 text-base">neesac ai</h3>
                    <p className="text-sm text-gray-500 flex items-center">
                      Posting publicly across Google
                      <svg className="w-4 h-4 ml-1 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                      </svg>
                    </p>
                  </div>
                </div>

                {/* Star Rating - Google Style (5 filled stars) */}
                <div className="flex items-center justify-center space-x-1 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFeedbackData({ ...feedbackData, rating: star })}
                      className="focus:outline-none transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= feedbackData.rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'fill-gray-200 text-gray-200'
                        } transition-colors duration-150`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Form Content - Exact Google Style */}
              <form onSubmit={handleSubmitFeedback} className="p-6">
                {/* Main Review Textarea - Google Style */}
                <div className="mb-6">
                  <textarea
                    value={feedbackData.content}
                    onChange={(e) => setFeedbackData({ ...feedbackData, content: e.target.value })}
                    className="w-full px-0 py-3 border-0 border-b border-gray-300 focus:border-blue-500 focus:ring-0 focus:outline-none resize-none text-gray-700 placeholder-gray-400 text-base leading-relaxed"
                    rows={4}
                    placeholder="Share details of your own experience at this place"
                    required
                  />
                </div>

                {/* Add Photos Button - Google Style */}
                <button
                  type="button"
                  className="w-full py-3 mb-6 rounded-full bg-blue-50 text-blue-600 font-medium hover:bg-blue-100 transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                  </svg>
                  <span>Add photos and videos</span>
                </button>

                {/* Submit Buttons - Google Style */}
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setView('choice')}
                    className="px-6 py-2 text-blue-600 font-medium hover:bg-blue-50 rounded-md transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingFeedback || !feedbackData.content}
                    className="px-8 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center"
                  >
                    {submittingFeedback ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Posting...
                      </>
                    ) : (
                      'Post'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Footer - Only show for non-feedback views */}
      {view !== 'feedback' && (
        <footer className="py-6 text-center border-t border-gray-200 mt-12">
          <p className="text-sm text-gray-muted">
            Powered by{' '}
            <span className="font-semibold text-primary-dark">neesac</span>
            <span className="font-semibold text-primary">.ai</span>
          </p>
        </footer>
      )}
    </div>
  )
}

