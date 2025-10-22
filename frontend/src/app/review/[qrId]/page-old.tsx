'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import toast from 'react-hot-toast'
import { ThumbsUp, ThumbsDown, Star, Copy, ExternalLink } from 'lucide-react'
import { apiUrl } from '@/utils/api'

interface Business {
  id: string
  name: string
  description?: string
  logo_url?: string
  primary_color?: string
  secondary_color?: string
  google_place_id?: string
}

interface ReviewTemplate {
  id: string
  content: string
  seo_keywords: string[]
  seo_score: number
}

export default function ReviewPage() {
  const params = useParams()
  const qrId = params.qrId as string
  
  const [business, setBusiness] = useState<Business | null>(null)
  const [loading, setLoading] = useState(true)
  const [showReview, setShowReview] = useState(false)
  const [reviewTemplate, setReviewTemplate] = useState<ReviewTemplate | null>(null)
  const [rating, setRating] = useState(5)
  const [showFeedback, setShowFeedback] = useState(false)
  const [feedbackData, setFeedbackData] = useState({
    rating: 3,
    content: '',
    additionalComments: ''
  })

  useEffect(() => {
    fetchBusinessInfo()
  }, [qrId])

  const fetchBusinessInfo = async () => {
    try {
      const response = await fetch(apiUrl(`/api/qr/${qrId}`))
      const data = await response.json()
      
      if (data.success) {
        setBusiness(data.data.businesses)
      } else {
        toast.error('QR code not found')
      }
    } catch (error) {
      toast.error('Failed to load business information')
    } finally {
      setLoading(false)
    }
  }

  const handleThumbsUp = async () => {
    try {
      // Track thumbs up event
      await fetch(apiUrl(`/api/qr/${qrId}/track`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'thumbs_up' })
      })

      // Generate unique review based on templates
      const response = await fetch(apiUrl(`/api/reviews/generate-unique/${business?.id}`))
      const data = await response.json()
      
      if (data.success) {
        setReviewTemplate({ content: data.data.content })
        setShowReview(true)
      } else {
        toast.error('No review templates available. Please contact support.')
      }
    } catch (error) {
      toast.error('Failed to generate review')
    }
  }

  const handleThumbsDown = () => {
    setShowFeedback(true)
  }

  const copyReview = async () => {
    if (reviewTemplate) {
      try {
        await navigator.clipboard.writeText(reviewTemplate.content)
        toast.success('Review copied to clipboard!')
        
        // Track copy event with review content
        await fetch(apiUrl(`/api/qr/${qrId}/track`), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            action: 'copy_review',
            reviewContent: reviewTemplate.content
          })
        })
      } catch (error) {
        toast.error('Failed to copy review')
      }
    }
  }

  const openGoogleReviews = async () => {
    if (business?.google_place_id) {
      // Track Google redirect
      try {
        await fetch(apiUrl(`/api/qr/${qrId}/track`), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'google_redirect'
          })
        })
      } catch (error) {
        console.error('Failed to track Google redirect:', error)
      }
      
      const googleUrl = `https://search.google.com/local/writereview?placeid=${business.google_place_id}`
      window.open(googleUrl, '_blank')
    } else {
      toast.error('Google Place ID not configured')
    }
  }

  const submitFeedback = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch(apiUrl(`/api/feedback/submit`), {
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
        setShowFeedback(false)
        
        // Track feedback submission
        await fetch(apiUrl(`/api/qr/${qrId}/track`), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'submit_feedback' })
        })
      } else {
        toast.error('Failed to submit feedback')
      }
    } catch (error) {
      toast.error('Failed to submit feedback')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-light flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-muted">Loading...</p>
        </div>
      </div>
    )
  }

  if (!business) {
    return (
      <div className="min-h-screen bg-gray-light flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-text mb-4">QR Code Not Found</h1>
          <p className="text-gray-muted">This QR code is invalid or has expired.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-light">
      {/* Header */}
      <div className="header-gradient py-8">
        <div className="max-w-2xl mx-auto px-4 text-center">
          {business.logo_url && (
            <img 
              src={business.logo_url} 
              alt={business.name}
              className="w-16 h-16 mx-auto mb-4 rounded-lg object-cover"
            />
          )}
          <h1 className="text-3xl font-bold text-gray-text mb-2">{business.name}</h1>
          {business.description && (
            <p className="text-gray-muted">{business.description}</p>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        {!showReview && !showFeedback && (
          <div className="card text-center">
            <h2 className="text-2xl font-semibold text-gray-text mb-6">
              How was your experience?
            </h2>
            
            <div className="flex justify-center space-x-8 mb-8">
              <button
                onClick={handleThumbsUp}
                className="flex flex-col items-center p-6 rounded-lg border-2 border-gray-200 hover:border-primary hover:bg-primary/5 transition-colors"
              >
                <ThumbsUp className="w-12 h-12 text-success mb-2" />
                <span className="text-lg font-medium text-gray-text">Great!</span>
                <span className="text-sm text-gray-muted">Leave a review</span>
              </button>
              
              <button
                onClick={handleThumbsDown}
                className="flex flex-col items-center p-6 rounded-lg border-2 border-gray-200 hover:border-warning hover:bg-warning/5 transition-colors"
              >
                <ThumbsDown className="w-12 h-12 text-warning mb-2" />
                <span className="text-lg font-medium text-gray-text">Not great</span>
                <span className="text-sm text-gray-muted">Give feedback</span>
              </button>
            </div>
          </div>
        )}

        {/* Review Modal */}
        {showReview && reviewTemplate && (
          <div className="card">
            <h2 className="text-2xl font-semibold text-gray-text mb-6">Your Review</h2>
            
            {/* Star Rating */}
            <div className="flex items-center mb-4">
              <span className="text-gray-text mr-2">Rating:</span>
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className={`w-6 h-6 ${
                      star <= rating ? 'text-yellow-400' : 'text-gray-300'
                    }`}
                  >
                    <Star className="w-full h-full fill-current" />
                  </button>
                ))}
              </div>
            </div>

            {/* Review Content */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-gray-text leading-relaxed">{reviewTemplate.content}</p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={copyReview}
                className="flex-1 btn-primary flex items-center justify-center"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Review
              </button>
              
              <button
                onClick={openGoogleReviews}
                className="flex-1 btn-secondary flex items-center justify-center"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Google Reviews
              </button>
            </div>

            <div className="mt-4 text-center">
              <p className="text-sm text-gray-muted">
                Paste your review on Google and submit it!
              </p>
            </div>
          </div>
        )}

        {/* Feedback Form */}
        {showFeedback && (
          <div className="card">
            <h2 className="text-2xl font-semibold text-gray-text mb-6">Help Us Improve</h2>
            
            <form onSubmit={submitFeedback} className="space-y-6">
              {/* Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-text mb-2">
                  How would you rate your experience?
                </label>
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFeedbackData({...feedbackData, rating: star})}
                      className={`w-8 h-8 ${
                        star <= feedbackData.rating ? 'text-yellow-400' : 'text-gray-300'
                      }`}
                    >
                      <Star className="w-full h-full fill-current" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Feedback Content */}
              <div>
                <label htmlFor="content" className="block text-sm font-medium text-gray-text mb-2">
                  What could we improve?
                </label>
                <textarea
                  id="content"
                  value={feedbackData.content}
                  onChange={(e) => setFeedbackData({...feedbackData, content: e.target.value})}
                  className="input-field h-24 resize-none"
                  placeholder="Tell us what went wrong..."
                  required
                />
              </div>

              {/* Additional Comments */}
              <div>
                <label htmlFor="additionalComments" className="block text-sm font-medium text-gray-text mb-2">
                  Additional comments (optional)
                </label>
                <textarea
                  id="additionalComments"
                  value={feedbackData.additionalComments}
                  onChange={(e) => setFeedbackData({...feedbackData, additionalComments: e.target.value})}
                  className="input-field h-20 resize-none"
                  placeholder="Any other feedback..."
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowFeedback(false)}
                  className="flex-1 btn-neutral"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-primary"
                >
                  Submit Feedback
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}




