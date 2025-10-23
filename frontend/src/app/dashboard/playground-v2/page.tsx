'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2, Edit, Sparkles, Check, X, Save, FolderPlus } from 'lucide-react'
import toast from 'react-hot-toast'

interface Category {
  id: string
  name: string
  description: string
  review_templates?: Template[]
}

interface Template {
  id: string
  content: string
  word_count: number
  is_manual: boolean
  seo_keywords: string[]
  seo_score: number
}

interface Business {
  id: string
  name: string
}

export default function PlaygroundV2Page() {
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [selectedBusiness, setSelectedBusiness] = useState<string>('')
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const router = useRouter()

  // Combined category creation + template generation state
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [newCategoryStep, setNewCategoryStep] = useState<'category' | 'templates'>('category')
  const [newCategoryData, setNewCategoryData] = useState({
    name: '',
    description: '',
    businessContext: '',
    keywords: '',
    wordCounts: [20, 20, 20, 20, 50, 50, 50, 50, 100, 100], // Default: 4x20, 4x50, 2x100 = 10 templates
    tone: 'professional'
  })

  // Template generation state (for existing categories)
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [showGenerateForm, setShowGenerateForm] = useState(false)
  const [generateForm, setGenerateForm] = useState({
    businessContext: '',
    keywords: '',
    wordCounts: [20, 20, 20, 20, 50, 50, 50, 50, 100, 100],
    tone: 'professional'
  })

  // Manual template state
  const [showManualForm, setShowManualForm] = useState(false)
  const [manualForm, setManualForm] = useState({
    content: '',
    wordCount: 50,
    keywords: ''
  })

  // Template expansion state
  const [expandedTemplates, setExpandedTemplates] = useState<Set<string>>(new Set())

  const toggleTemplateExpansion = (templateId: string) => {
    setExpandedTemplates(prev => {
      const newSet = new Set(prev)
      if (newSet.has(templateId)) {
        newSet.delete(templateId)
      } else {
        newSet.add(templateId)
      }
      return newSet
    })
  }

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }
    fetchBusinesses()
  }, [])

  useEffect(() => {
    if (selectedBusiness) {
      fetchCategories()
    }
  }, [selectedBusiness])

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
      toast.error('Failed to fetch businesses')
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/categories/${selectedBusiness}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (data.success) {
        // Fetch templates for each category
        const categoriesWithTemplates = await Promise.all(
          data.data.map(async (cat: Category) => {
            const templatesResponse = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/api/reviews/templates/${selectedBusiness}?categoryId=${cat.id}`,
              { headers: { 'Authorization': `Bearer ${token}` } }
            )
            const templatesData = await templatesResponse.json()
            return {
              ...cat,
              review_templates: templatesData.success ? templatesData.data : []
            }
          })
        )
        setCategories(categoriesWithTemplates)
      }
    } catch (error) {
      toast.error('Failed to fetch categories')
    } finally {
      setLoading(false)
    }
  }

  const handleCategoryStepSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Prevent double submissions
    if (generating) {
      return
    }
    
    if (newCategoryStep === 'category') {
      // Validate category name
      if (!newCategoryData.name || newCategoryData.name.trim().length < 2) {
        toast.error('Category name must be at least 2 characters')
        return
      }
      // Move to template generation step
      setNewCategoryStep('templates')
    } else {
      // Validate template generation fields
      if (!newCategoryData.businessContext || newCategoryData.businessContext.trim().length < 10) {
        toast.error('Business context must be at least 10 characters')
        return
      }
      if (!newCategoryData.keywords || newCategoryData.keywords.trim().length < 2) {
        toast.error('Please provide at least one keyword')
        return
      }
      if (newCategoryData.wordCounts.length === 0) {
        toast.error('Please select at least one word count')
        return
      }

      // Create category and generate templates
      try {
        setGenerating(true)
        const token = localStorage.getItem('token')
        
        console.log('Creating category with word counts:', newCategoryData.wordCounts)
        
        // Step 1: Create the category
        const categoryResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/categories`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            businessId: selectedBusiness,
            name: newCategoryData.name,
            description: newCategoryData.description
          })
        })
        const categoryData = await categoryResponse.json()
        
        if (!categoryData.success) {
          toast.error(categoryData.error || 'Failed to create category')
          setGenerating(false)
          return
        }

        console.log('Category created:', categoryData.data.id)
        console.log('Generating templates with counts:', newCategoryData.wordCounts)

        // Step 2: Generate templates for the new category
        const templatesResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reviews/generate-by-category`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            categoryId: categoryData.data.id,
            businessContext: newCategoryData.businessContext,
            keywords: newCategoryData.keywords.split(',').map(k => k.trim()),
            count: newCategoryData.wordCounts.length,
            wordCounts: newCategoryData.wordCounts,
            tone: newCategoryData.tone
          })
        })
        const templatesData = await templatesResponse.json()

        console.log('Templates generated:', templatesData)

        if (templatesData.success) {
          toast.success(`Category created with ${templatesData.data.length} templates!`)
          setShowCategoryForm(false)
          setNewCategoryStep('category')
          setNewCategoryData({
            name: '',
            description: '',
            businessContext: '',
            keywords: '',
            wordCounts: [20, 20, 20, 20, 50, 50, 50, 50, 100, 100],
            tone: 'professional'
          })
          fetchCategories()
        } else {
          toast.error(templatesData.error || 'Failed to generate templates')
        }
      } catch (error: any) {
        console.error('Error:', error)
        toast.error(error.message || 'Failed to create category and templates')
      } finally {
        setGenerating(false)
      }
    }
  }

  const handleCancelCategoryForm = () => {
    setShowCategoryForm(false)
    setNewCategoryStep('category')
    setNewCategoryData({
      name: '',
      description: '',
      businessContext: '',
      keywords: '',
      wordCounts: [20, 20, 20, 20, 50, 50, 50, 50, 100, 100],
      tone: 'professional'
    })
  }

  const handleGenerateTemplates = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setGenerating(true)
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reviews/generate-by-category`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          categoryId: selectedCategory,
          businessContext: generateForm.businessContext,
          keywords: generateForm.keywords.split(',').map(k => k.trim()),
          count: generateForm.wordCounts.length,
          wordCounts: generateForm.wordCounts,
          tone: generateForm.tone
        })
      })
      const data = await response.json()
      if (data.success) {
        toast.success(`Generated ${data.data.length} templates!`)
        setShowGenerateForm(false)
        fetchCategories()
      } else {
        toast.error(data.error || 'Failed to generate templates')
      }
    } catch (error) {
      toast.error('Failed to generate templates')
    } finally {
      setGenerating(false)
    }
  }

  const handleCreateManualTemplate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reviews/manual-template`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          categoryId: selectedCategory,
          content: manualForm.content,
          wordCount: manualForm.wordCount,
          keywords: manualForm.keywords.split(',').map(k => k.trim())
        })
      })
      const data = await response.json()
      if (data.success) {
        toast.success('Manual template created!')
        setShowManualForm(false)
        setManualForm({ content: '', wordCount: 50, keywords: '' })
        fetchCategories()
      } else {
        toast.error(data.error || 'Failed to create template')
      }
    } catch (error) {
      toast.error('Failed to create template')
    }
  }

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reviews/templates/${templateId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (data.success) {
        toast.success('Template deleted!')
        fetchCategories()
      } else {
        toast.error(data.error || 'Failed to delete template')
      }
    } catch (error) {
      toast.error('Failed to delete template')
    }
  }

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category? All templates will be deleted.')) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/categories/${categoryId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (data.success) {
        toast.success('Category deleted!')
        fetchCategories()
      } else {
        toast.error(data.error || 'Failed to delete category')
      }
    } catch (error) {
      toast.error('Failed to delete category')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Link href="/dashboard" className="mr-4">
              <ArrowLeft className="w-6 h-6 text-gray-600 hover:text-primary" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-text">Review Playground</h1>
              <p className="text-gray-muted mt-1">Manage categories and generate review templates</p>
            </div>
          </div>
          
          <button
            onClick={() => setShowCategoryForm(true)}
            className="btn-primary flex items-center"
          >
            <FolderPlus className="w-5 h-5 mr-2" />
            New Category
          </button>
        </div>

        {/* Business Selector */}
        {businesses.length > 1 && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-text mb-2">Select Business</label>
            <select
              value={selectedBusiness}
              onChange={(e) => setSelectedBusiness(e.target.value)}
              className="input-field"
            >
              {businesses.map(business => (
                <option key={business.id} value={business.id}>{business.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Categories Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {categories.map(category => (
            <div key={category.id} className="card">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-text">{category.name}</h3>
                  {category.description && (
                    <p className="text-sm text-gray-muted mt-1">{category.description}</p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setSelectedCategory(category.id)
                      setShowGenerateForm(true)
                    }}
                    className="p-2 text-primary hover:bg-blue-50 rounded"
                    title="Generate AI Templates"
                  >
                    <Sparkles className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedCategory(category.id)
                      setShowManualForm(true)
                    }}
                    className="p-2 text-green-600 hover:bg-green-50 rounded"
                    title="Add Manual Template"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(category.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded"
                    title="Delete Category"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Templates */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {category.review_templates && category.review_templates.length > 0 ? (
                  category.review_templates.map(template => {
                    const isExpanded = expandedTemplates.has(template.id)
                    const isLong = template.content.length > 150
                    
                    return (
                      <div key={template.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-start justify-between mb-2">
                          <span className={`text-xs px-2 py-1 rounded ${template.is_manual ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                            {template.is_manual ? 'Manual' : 'AI Generated'} • {template.word_count} words
                          </span>
                          <button
                            onClick={() => handleDeleteTemplate(template.id)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <p className={`text-sm text-gray-text ${!isExpanded && isLong ? 'line-clamp-3' : ''}`}>
                          {template.content}
                        </p>
                        {isLong && (
                          <button
                            onClick={() => toggleTemplateExpansion(template.id)}
                            className="text-xs text-primary hover:underline mt-1"
                          >
                            {isExpanded ? 'Show less' : 'Read more'}
                          </button>
                        )}
                      </div>
                    )
                  })
                ) : (
                  <p className="text-sm text-gray-muted text-center py-4">No templates yet. Generate or add manually.</p>
                )}
              </div>
            </div>
          ))}

          {categories.length === 0 && (
            <div className="col-span-2 text-center py-12">
              <FolderPlus className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-text mb-2">No categories yet</h3>
              <p className="text-gray-muted mb-4">Create your first category to start managing review templates</p>
              <button
                onClick={() => setShowCategoryForm(true)}
                className="btn-primary"
              >
                Create Category
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Create Category Modal - Two Steps */}
      {showCategoryForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 my-8">
            <h2 className="text-2xl font-bold text-gray-text mb-4">
              {newCategoryStep === 'category' ? 'Create New Category' : 'Generate AI Templates'}
            </h2>
            
            {/* Step Indicator */}
            <div className="flex items-center justify-center mb-6">
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${newCategoryStep === 'category' ? 'bg-primary text-white' : 'bg-green-500 text-white'}`}>
                  {newCategoryStep === 'templates' ? '✓' : '1'}
                </div>
                <div className="w-20 h-1 bg-gray-300 mx-2"></div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${newCategoryStep === 'templates' ? 'bg-primary text-white' : 'bg-gray-300 text-gray-600'}`}>
                  2
                </div>
              </div>
            </div>

            <form onSubmit={handleCategoryStepSubmit}>
              {newCategoryStep === 'category' ? (
                <>
                  {/* Step 1: Category Info */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-text mb-2">Category Name *</label>
                    <input
                      type="text"
                      value={newCategoryData.name}
                      onChange={(e) => setNewCategoryData({ ...newCategoryData, name: e.target.value })}
                      className="input-field"
                      placeholder="e.g., SEO, Social Media, General"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-text mb-2">Description (Optional)</label>
                    <textarea
                      value={newCategoryData.description}
                      onChange={(e) => setNewCategoryData({ ...newCategoryData, description: e.target.value })}
                      className="input-field"
                      rows={3}
                      placeholder="Brief description of this category"
                    />
                  </div>
                </>
              ) : (
                <>
                  {/* Step 2: Template Generation */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-text mb-2">Business Context *</label>
                    <textarea
                      value={newCategoryData.businessContext}
                      onChange={(e) => setNewCategoryData({ ...newCategoryData, businessContext: e.target.value })}
                      className="input-field"
                      rows={3}
                      placeholder="Describe your business and what makes it special..."
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-text mb-2">Keywords (comma-separated) *</label>
                    <input
                      type="text"
                      value={newCategoryData.keywords}
                      onChange={(e) => setNewCategoryData({ ...newCategoryData, keywords: e.target.value })}
                      className="input-field"
                      placeholder="SEO, digital marketing, results, growth"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-text mb-2">Tone</label>
                    <select
                      value={newCategoryData.tone}
                      onChange={(e) => setNewCategoryData({ ...newCategoryData, tone: e.target.value })}
                      className="input-field"
                    >
                      <option value="professional">Professional</option>
                      <option value="casual">Casual</option>
                      <option value="enthusiastic">Enthusiastic</option>
                    </select>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-text mb-2">
                      Word Count Distribution (default: 4×20, 4×50, 2×100 = 10 templates)
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-xs text-gray-muted">20-word reviews</label>
                        <input
                          type="number"
                          value={newCategoryData.wordCounts.filter(w => w === 20).length}
                          onChange={(e) => {
                            const count20 = parseInt(e.target.value) || 0
                            const count50 = newCategoryData.wordCounts.filter(w => w === 50).length
                            const count100 = newCategoryData.wordCounts.filter(w => w === 100).length
                            const newCounts = [
                              ...Array(count20).fill(20),
                              ...Array(count50).fill(50),
                              ...Array(count100).fill(100)
                            ]
                            setNewCategoryData({ ...newCategoryData, wordCounts: newCounts })
                          }}
                          className="input-field"
                          min="0"
                          max="20"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-muted">50-word reviews</label>
                        <input
                          type="number"
                          value={newCategoryData.wordCounts.filter(w => w === 50).length}
                          onChange={(e) => {
                            const count20 = newCategoryData.wordCounts.filter(w => w === 20).length
                            const count50 = parseInt(e.target.value) || 0
                            const count100 = newCategoryData.wordCounts.filter(w => w === 100).length
                            const newCounts = [
                              ...Array(count20).fill(20),
                              ...Array(count50).fill(50),
                              ...Array(count100).fill(100)
                            ]
                            setNewCategoryData({ ...newCategoryData, wordCounts: newCounts })
                          }}
                          className="input-field"
                          min="0"
                          max="20"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-muted">100-word reviews</label>
                        <input
                          type="number"
                          value={newCategoryData.wordCounts.filter(w => w === 100).length}
                          onChange={(e) => {
                            const count20 = newCategoryData.wordCounts.filter(w => w === 20).length
                            const count50 = newCategoryData.wordCounts.filter(w => w === 50).length
                            const count100 = parseInt(e.target.value) || 0
                            const newCounts = [
                              ...Array(count20).fill(20),
                              ...Array(count50).fill(50),
                              ...Array(count100).fill(100)
                            ]
                            setNewCategoryData({ ...newCategoryData, wordCounts: newCounts })
                          }}
                          className="input-field"
                          min="0"
                          max="20"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-muted mt-2">
                      Total: {newCategoryData.wordCounts.length} templates
                    </p>
                  </div>
                </>
              )}

              <div className="flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCancelCategoryForm}
                  className="btn-secondary"
                  disabled={generating}
                >
                  Cancel
                </button>
                {newCategoryStep === 'templates' && (
                  <button
                    type="button"
                    onClick={() => setNewCategoryStep('category')}
                    className="btn-secondary"
                    disabled={generating}
                  >
                    Back
                  </button>
                )}
                <button type="submit" className="btn-primary flex items-center" disabled={generating}>
                  {generating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      {newCategoryStep === 'category' ? 'Next: Templates' : 'Create Category'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Generate Templates Modal */}
      {showGenerateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 my-8">
            <h2 className="text-2xl font-bold text-gray-text mb-4">Generate AI Templates</h2>
            <form onSubmit={handleGenerateTemplates}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-text mb-2">Business Context</label>
                <textarea
                  value={generateForm.businessContext}
                  onChange={(e) => setGenerateForm({ ...generateForm, businessContext: e.target.value })}
                  className="input-field"
                  rows={3}
                  placeholder="Describe your business and what makes it special..."
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-text mb-2">Keywords (comma-separated)</label>
                <input
                  type="text"
                  value={generateForm.keywords}
                  onChange={(e) => setGenerateForm({ ...generateForm, keywords: e.target.value })}
                  className="input-field"
                  placeholder="SEO, digital marketing, results, growth"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-text mb-2">Tone</label>
                <select
                  value={generateForm.tone}
                  onChange={(e) => setGenerateForm({ ...generateForm, tone: e.target.value })}
                  className="input-field"
                >
                  <option value="professional">Professional</option>
                  <option value="casual">Casual</option>
                  <option value="enthusiastic">Enthusiastic</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-text mb-2">
                  Word Count Distribution (default: 4x20, 4x50, 2x100 = 10 templates)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs text-gray-muted">20-word reviews</label>
                    <input
                      type="number"
                      value={generateForm.wordCounts.filter(w => w === 20).length}
                      onChange={(e) => {
                        const count = parseInt(e.target.value) || 0
                        const others = generateForm.wordCounts.filter(w => w !== 20)
                        setGenerateForm({ ...generateForm, wordCounts: [...Array(count).fill(20), ...others] })
                      }}
                      className="input-field"
                      min="0"
                      max="10"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-muted">50-word reviews</label>
                    <input
                      type="number"
                      value={generateForm.wordCounts.filter(w => w === 50).length}
                      onChange={(e) => {
                        const count = parseInt(e.target.value) || 0
                        const others = generateForm.wordCounts.filter(w => w !== 50)
                        setGenerateForm({ ...generateForm, wordCounts: [...Array(count).fill(50), ...others] })
                      }}
                      className="input-field"
                      min="0"
                      max="10"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-muted">100-word reviews</label>
                    <input
                      type="number"
                      value={generateForm.wordCounts.filter(w => w === 100).length}
                      onChange={(e) => {
                        const count = parseInt(e.target.value) || 0
                        const others = generateForm.wordCounts.filter(w => w !== 100)
                        setGenerateForm({ ...generateForm, wordCounts: [...Array(count).fill(100), ...others] })
                      }}
                      className="input-field"
                      min="0"
                      max="10"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-muted mt-2">
                  Total: {generateForm.wordCounts.length} templates
                </p>
              </div>
              <div className="flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowGenerateForm(false)}
                  className="btn-secondary"
                  disabled={generating}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex items-center" disabled={generating}>
                  {generating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Templates
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Template Modal */}
      {showManualForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <h2 className="text-2xl font-bold text-gray-text mb-4">Add Manual Template</h2>
            <form onSubmit={handleCreateManualTemplate}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-text mb-2">Review Content</label>
                <textarea
                  value={manualForm.content}
                  onChange={(e) => setManualForm({ ...manualForm, content: e.target.value })}
                  className="input-field"
                  rows={6}
                  placeholder="Write your review template here..."
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-text mb-2">Target Word Count</label>
                <input
                  type="number"
                  value={manualForm.wordCount}
                  onChange={(e) => setManualForm({ ...manualForm, wordCount: parseInt(e.target.value) })}
                  className="input-field"
                  min="10"
                  max="200"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-text mb-2">Keywords (comma-separated, optional)</label>
                <input
                  type="text"
                  value={manualForm.keywords}
                  onChange={(e) => setManualForm({ ...manualForm, keywords: e.target.value })}
                  className="input-field"
                  placeholder="keyword1, keyword2, keyword3"
                />
              </div>
              <div className="flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowManualForm(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Add Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

