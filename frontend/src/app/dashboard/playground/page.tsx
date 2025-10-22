'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Sparkles, Check, X, Edit, Copy, Download, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface GeneratedReview {
  text: string
  keywords_used: string[]
  seo_score: number
}

interface ReviewTemplate {
  id: string
  content: string
  seo_keywords: string[]
  seo_score: number
  status: string
  times_shown: number
  times_copied: number
  conversion_rate: number
}

interface AIModelConfig {
  id: string
  model_name: string
  provider: string
  model: string
  is_active: boolean
}

export default function ReviewPlaygroundPage() {
  const [formData, setFormData] = useState({
    businessContext: '',
    keywords: '',
    count: 5,
    tone: 'enthusiastic',
    length: 'medium',
    aiModel: '',
    aiConfigId: ''
  })
  const [generatedReviews, setGeneratedReviews] = useState<GeneratedReview[]>([])
  const [loading, setLoading] = useState(false)
  const [templates, setTemplates] = useState<ReviewTemplate[]>([])
  const [selectedBusiness, setSelectedBusiness] = useState('')
  const [businesses, setBusinesses] = useState<any[]>([])
  const [aiConfigs, setAiConfigs] = useState<AIModelConfig[]>([])
  const router = useRouter()

  useEffect(() => {
    checkAuth()
    fetchBusinesses()
  }, [])

  useEffect(() => {
    if (selectedBusiness) {
      fetchTemplates()
      fetchAIConfigs()
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
    }
  }

  const fetchTemplates = async () => {
    if (!selectedBusiness) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reviews/templates/${selectedBusiness}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      const data = await response.json()
      
      if (data.success) {
        setTemplates(data.data)
      }
    } catch (error) {
      console.error('Failed to load templates:', error)
    }
  }

  const fetchAIConfigs = async () => {
    if (!selectedBusiness) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ai-config/models/${selectedBusiness}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      const data = await response.json()
      
      if (data.success) {
        const activeConfigs = data.data.filter((config: AIModelConfig) => config.is_active)
        setAiConfigs(activeConfigs)
        
        // Set first active config as default
        if (activeConfigs.length > 0) {
          setFormData(prev => ({
            ...prev,
            aiModel: activeConfigs[0].provider,
            aiConfigId: activeConfigs[0].id
          }))
        }
      }
    } catch (error) {
      console.error('Failed to load AI configs:', error)
      toast.error('Please configure an AI model first')
    }
  }

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reviews/generate?businessId=${selectedBusiness}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          keywords: formData.keywords.split(',').map(k => k.trim()).filter(k => k)
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setGeneratedReviews(data.data.reviews)
        toast.success('Reviews generated successfully!')
      } else {
        toast.error(data.error || 'Failed to generate reviews')
      }
    } catch (error) {
      toast.error('Failed to generate reviews')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveTemplate = async (review: GeneratedReview) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reviews/templates`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          businessId: selectedBusiness,
          content: review.text,
          seoKeywords: review.keywords_used,
          seoScore: review.seo_score
        })
      })

      const data = await response.json()
      
      if (data.success) {
        toast.success('Template saved successfully!')
        fetchTemplates()
      } else {
        toast.error(data.error || 'Failed to save template')
      }
    } catch (error) {
      toast.error('Failed to save template')
    }
  }

  const handleUpdateTemplateStatus = async (templateId: string, status: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reviews/templates/${templateId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      })

      const data = await response.json()
      
      if (data.success) {
        toast.success('Template status updated!')
        fetchTemplates()
      } else {
        toast.error(data.error || 'Failed to update template')
      }
    } catch (error) {
      toast.error('Failed to update template')
    }
  }

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template? This action cannot be undone.')) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reviews/templates/${templateId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      
      if (data.success) {
        toast.success('Template deleted successfully!')
        fetchTemplates()
      } else {
        toast.error(data.error || 'Failed to delete template')
      }
    } catch (error) {
      toast.error('Failed to delete template')
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Copied to clipboard!')
    } catch (error) {
      toast.error('Failed to copy to clipboard')
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
            <h1 className="text-2xl font-bold text-gray-text">Review Playground</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Generation Form */}
          <div className="space-y-6">
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-text mb-4">Generate AI Reviews</h2>
              
              <form onSubmit={handleGenerate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-text mb-2">
                    Business Context
                  </label>
                  <textarea
                    value={formData.businessContext}
                    onChange={(e) => setFormData({...formData, businessContext: e.target.value})}
                    className="input-field h-24 resize-none"
                    placeholder="e.g., Italian restaurant, family-owned, specializes in homemade pasta and tiramisu"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-text mb-2">
                    SEO Keywords (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.keywords}
                    onChange={(e) => setFormData({...formData, keywords: e.target.value})}
                    className="input-field"
                    placeholder="e.g., authentic pasta, family atmosphere, best tiramisu"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-text mb-2">
                      Number of Reviews
                    </label>
                    <select
                      value={formData.count}
                      onChange={(e) => setFormData({...formData, count: parseInt(e.target.value)})}
                      className="input-field"
                    >
                      {[1,2,3,4,5,6,7,8,9,10].map(num => (
                        <option key={num} value={num}>{num}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-text mb-2">
                      Tone
                    </label>
                    <select
                      value={formData.tone}
                      onChange={(e) => setFormData({...formData, tone: e.target.value})}
                      className="input-field"
                    >
                      <option value="professional">Professional</option>
                      <option value="casual">Casual</option>
                      <option value="enthusiastic">Enthusiastic</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-text mb-2">
                      Length
                    </label>
                    <select
                      value={formData.length}
                      onChange={(e) => setFormData({...formData, length: e.target.value})}
                      className="input-field"
                    >
                      <option value="short">Short (50-100 words)</option>
                      <option value="medium">Medium (100-150 words)</option>
                      <option value="long">Long (150-200 words)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-text mb-2">
                      AI Model {aiConfigs.length === 0 && <span className="text-xs text-warning">(No models configured)</span>}
                    </label>
                    <select
                      value={formData.aiConfigId}
                      onChange={(e) => {
                        const selectedConfig = aiConfigs.find(c => c.id === e.target.value)
                        if (selectedConfig) {
                          setFormData({
                            ...formData,
                            aiModel: selectedConfig.provider,
                            aiConfigId: selectedConfig.id
                          })
                        }
                      }}
                      className="input-field"
                      disabled={aiConfigs.length === 0}
                      required
                    >
                      {aiConfigs.length === 0 ? (
                        <option value="">No AI models configured</option>
                      ) : (
                        aiConfigs.map(config => (
                          <option key={config.id} value={config.id}>
                            {config.model_name} ({config.provider} - {config.model})
                          </option>
                        ))
                      )}
                    </select>
                    {aiConfigs.length === 0 && (
                      <p className="text-xs text-warning mt-1">
                        Go to <button 
                          onClick={() => router.push('/dashboard/ai-config')}
                          className="underline hover:text-primary"
                        >
                          AI Configuration
                        </button> to add a model
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Reviews
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Generated Reviews */}
            {generatedReviews.length > 0 && (
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-text mb-4">Generated Reviews</h3>
                <div className="space-y-4">
                  {generatedReviews.map((review, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-text">Review {index + 1}</span>
                          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                            SEO: {review.seo_score}
                          </span>
                        </div>
                        <button
                          onClick={() => handleSaveTemplate(review)}
                          className="btn-primary text-sm"
                        >
                          Save Template
                        </button>
                      </div>
                      <p className="text-gray-text mb-2">{review.text}</p>
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-muted">
                          Keywords: {review.keywords_used.join(', ')}
                        </div>
                        <button
                          onClick={() => copyToClipboard(review.text)}
                          className="text-primary hover:underline text-sm"
                        >
                          <Copy className="w-3 h-3 inline mr-1" />
                          Copy
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Template Management */}
          <div className="space-y-6">
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-text mb-4">Review Templates</h3>
              
              {templates.length > 0 ? (
                <div className="space-y-4">
                  {templates.map((template) => (
                    <div key={template.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            template.status === 'active' ? 'bg-success/10 text-success' :
                            template.status === 'approved' ? 'bg-primary/10 text-primary' :
                            template.status === 'draft' ? 'bg-warning/10 text-warning' :
                            'bg-gray-muted/10 text-gray-muted'
                          }`}>
                            {template.status}
                          </span>
                          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                            SEO: {template.seo_score}
                          </span>
                        </div>
                        <div className="flex space-x-1">
                          {template.status === 'draft' && (
                            <button
                              onClick={() => handleUpdateTemplateStatus(template.id, 'approved')}
                              className="p-1 text-success hover:bg-success/10 rounded"
                              title="Approve"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          {template.status === 'approved' && (
                            <button
                              onClick={() => handleUpdateTemplateStatus(template.id, 'active')}
                              className="p-1 text-primary hover:bg-primary/10 rounded"
                              title="Activate"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => copyToClipboard(template.content)}
                            className="p-1 text-gray-muted hover:bg-gray-100 rounded"
                            title="Copy"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTemplate(template.id)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <p className="text-gray-text mb-2 text-sm">{template.content}</p>
                      <div className="flex items-center justify-between text-xs text-gray-muted">
                        <span>Keywords: {template.seo_keywords.join(', ')}</span>
                        <span>Shown: {template.times_shown} | Copied: {template.times_copied}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-muted text-center py-8">No templates yet. Generate some reviews to get started!</p>
              )}
            </div>

            {/* Template Stats */}
            {templates.length > 0 && (
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-text mb-4">Template Statistics</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{templates.length}</p>
                    <p className="text-sm text-gray-muted">Total Templates</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-success">
                      {templates.filter(t => t.status === 'active').length}
                    </p>
                    <p className="text-sm text-gray-muted">Active</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}




