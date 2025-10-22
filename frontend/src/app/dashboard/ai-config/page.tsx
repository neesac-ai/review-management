'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Plus, TestTube, Trash2, Save, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

interface AIModelConfig {
  id?: string
  model_name: string
  provider: string
  api_key: string
  model: string
  is_active: boolean
  created_at?: string
}

interface AIModel {
  id: string
  name: string
  provider: string
  context_length?: number
}

const AI_PROVIDERS = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'groq', label: 'Groq' },
  { value: 'google', label: 'Google' }
]

export default function AIConfigPage() {
  const [configs, setConfigs] = useState<AIModelConfig[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedBusiness, setSelectedBusiness] = useState('')
  const [businesses, setBusinesses] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState<string | null>(null)
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({})
  const [availableModels, setAvailableModels] = useState<Record<string, AIModel[]>>({})
  const [loadingModels, setLoadingModels] = useState(false)
  
  const [newConfig, setNewConfig] = useState<AIModelConfig>({
    model_name: '',
    provider: 'openai',
    api_key: '',
    model: '',
    is_active: true
  })

  const router = useRouter()

  useEffect(() => {
    checkAuth()
    fetchBusinesses()
    fetchAllAvailableModels()
  }, [])

  useEffect(() => {
    if (selectedBusiness) {
      fetchConfigs()
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

  const fetchConfigs = async () => {
    if (!selectedBusiness) return
    
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ai-config/models/${selectedBusiness}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      const data = await response.json()
      if (data.success) {
        setConfigs(data.data)
      }
    } catch (error) {
      toast.error('Failed to load AI configurations')
    }
  }

  const fetchAllAvailableModels = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ai-config/discover/all`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      const data = await response.json()
      if (data.success) {
        setAvailableModels(data.data)
      }
    } catch (error) {
      console.error('Failed to load available models:', error)
      // Set empty object on error
      setAvailableModels({})
    }
  }

  const fetchModelsForProvider = async (provider: string, apiKey?: string) => {
    setLoadingModels(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ai-config/discover`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ provider, apiKey })
      })
      
      const data = await response.json()
      if (data.success) {
        setAvailableModels(prev => ({
          ...prev,
          [provider]: data.data.models
        }))
        toast.success('Models loaded successfully!')
      } else {
        toast.error('Failed to fetch models')
      }
    } catch (error) {
      toast.error('Failed to fetch models from provider')
    } finally {
      setLoadingModels(false)
    }
  }

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBusiness) return

    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ai-config/models`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          businessId: selectedBusiness,
          modelName: newConfig.model_name,
          provider: newConfig.provider,
          apiKey: newConfig.api_key,
          model: newConfig.model,
          isActive: newConfig.is_active
        })
      })

      const data = await response.json()
      if (data.success) {
        toast.success('AI configuration saved successfully!')
        setShowAddForm(false)
        setNewConfig({
          model_name: '',
          provider: 'openai',
          api_key: '',
          model: 'gpt-4',
          is_active: true
        })
        fetchConfigs()
      } else {
        toast.error(data.error || 'Failed to save configuration')
      }
    } catch (error) {
      toast.error('Failed to save configuration')
    } finally {
      setLoading(false)
    }
  }

  const handleTestConfig = async (config: AIModelConfig) => {
    setTesting(config.id || 'new')
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ai-config/test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          provider: config.provider,
          apiKey: config.api_key,
          model: config.model
        })
      })

      const data = await response.json()
      if (data.success) {
        toast.success('AI model test successful!')
      } else {
        toast.error(data.error || 'AI model test failed')
      }
    } catch (error) {
      toast.error('AI model test failed')
    } finally {
      setTesting(null)
    }
  }

  const handleDeleteConfig = async (configId: string) => {
    if (!confirm('Are you sure you want to delete this AI configuration?')) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ai-config/models/${configId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      const data = await response.json()
      if (data.success) {
        toast.success('AI configuration deleted successfully!')
        fetchConfigs()
      } else {
        toast.error(data.error || 'Failed to delete configuration')
      }
    } catch (error) {
      toast.error('Failed to delete configuration')
    }
  }

  const toggleApiKeyVisibility = (configId: string) => {
    setShowApiKeys(prev => ({
      ...prev,
      [configId]: !prev[configId]
    }))
  }

  const getProviderModels = (provider: string): AIModel[] => {
    return availableModels[provider] || []
  }

  const handleProviderChange = async (provider: string) => {
    setNewConfig({
      ...newConfig,
      provider,
      model: ''
    })
    
    // If API key is already entered, fetch real-time models
    if (newConfig.api_key && newConfig.api_key.length >= 10) {
      await fetchModelsForProvider(provider, newConfig.api_key)
    }
  }

  const handleApiKeyBlur = async () => {
    // When API key is entered/changed, fetch real-time models
    if (newConfig.api_key && newConfig.api_key.length >= 10) {
      await fetchModelsForProvider(newConfig.provider, newConfig.api_key)
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
            <h1 className="text-2xl font-bold text-gray-text">AI Model Configuration</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

        {/* Add New Configuration */}
        {selectedBusiness && (
          <div className="card mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-text">AI Model Configurations</h3>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="btn-primary flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Configuration
              </button>
            </div>

            {showAddForm && (
              <form onSubmit={handleSaveConfig} className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-text mb-2">
                      Model Name
                    </label>
                    <input
                      type="text"
                      value={newConfig.model_name}
                      onChange={(e) => setNewConfig({...newConfig, model_name: e.target.value})}
                      className="input-field"
                      placeholder="e.g., My GPT-4 Config"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-text mb-2">
                      Provider
                    </label>
                    <select
                      value={newConfig.provider}
                      onChange={(e) => handleProviderChange(e.target.value)}
                      className="input-field"
                    >
                      {AI_PROVIDERS.map(provider => (
                        <option key={provider.value} value={provider.value}>
                          {provider.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-text mb-2">
                      API Key
                    </label>
                    <input
                      type="password"
                      value={newConfig.api_key}
                      onChange={(e) => setNewConfig({...newConfig, api_key: e.target.value})}
                      onBlur={handleApiKeyBlur}
                      className="input-field"
                      placeholder="Enter your API key (will auto-fetch models)"
                      required
                    />
                    <p className="text-xs text-gray-muted mt-1">
                      Enter your API key and press Tab to load real-time models
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-text mb-2">
                      Model {loadingModels && <span className="text-xs text-primary">(Loading...)</span>}
                    </label>
                    <select
                      value={newConfig.model}
                      onChange={(e) => setNewConfig({...newConfig, model: e.target.value})}
                      className="input-field"
                      disabled={loadingModels || getProviderModels(newConfig.provider).length === 0}
                      required
                    >
                      <option value="">Select a model</option>
                      {getProviderModels(newConfig.provider).map(model => (
                        <option key={model.id} value={model.id}>
                          {model.name}
                          {model.context_length && ` (${(model.context_length / 1000).toFixed(0)}K context)`}
                        </option>
                      ))}
                    </select>
                    {getProviderModels(newConfig.provider).length === 0 && (
                      <p className="text-xs text-warning mt-1">
                        Enter API key above to load available models
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newConfig.is_active}
                      onChange={(e) => setNewConfig({...newConfig, is_active: e.target.checked})}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-text">Active</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => handleTestConfig(newConfig)}
                    disabled={testing === 'new' || !newConfig.api_key}
                    className="btn-secondary flex items-center"
                  >
                    {testing === 'new' ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                        Testing...
                      </>
                    ) : (
                      <>
                        <TestTube className="w-4 h-4 mr-2" />
                        Test Configuration
                      </>
                    )}
                  </button>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="btn-neutral"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary flex items-center"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Configuration
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Existing Configurations */}
        {selectedBusiness && (
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-text mb-4">Current Configurations</h3>
            
            {configs.length > 0 ? (
              <div className="space-y-4">
                {configs.map((config) => (
                  <div key={config.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-medium text-gray-text">{config.model_name}</h4>
                        <p className="text-sm text-gray-muted">
                          {AI_PROVIDERS.find(p => p.value === config.provider)?.label} • {config.model}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          config.is_active ? 'bg-success/10 text-success' : 'bg-gray-muted/10 text-gray-muted'
                        }`}>
                          {config.is_active ? 'Active' : 'Inactive'}
                        </span>
                        <button
                          onClick={() => handleTestConfig(config)}
                          disabled={testing === config.id}
                          className="btn-secondary text-sm"
                        >
                          {testing === config.id ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary mr-1"></div>
                              Testing...
                            </>
                          ) : (
                            <>
                              <TestTube className="w-3 h-3 mr-1" />
                              Test
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteConfig(config.id!)}
                          className="btn-neutral text-sm text-warning hover:bg-warning/10"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-muted">API Key:</span>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {showApiKeys[config.id!] 
                          ? config.api_key 
                          : '••••••••••••••••'
                        }
                      </code>
                      <button
                        onClick={() => toggleApiKeyVisibility(config.id!)}
                        className="text-gray-muted hover:text-gray-text"
                      >
                        {showApiKeys[config.id!] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-muted text-center py-8">
                No AI configurations yet. Add one to get started!
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}


