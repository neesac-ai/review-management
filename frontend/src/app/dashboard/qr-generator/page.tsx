'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, QrCode, Download, Copy } from 'lucide-react'
import toast from 'react-hot-toast'

export default function QRGeneratorPage() {
  const [businesses, setBusinesses] = useState<any[]>([])
  const [selectedBusiness, setSelectedBusiness] = useState('')
  const [qrType, setQrType] = useState<'business' | 'location' | 'transaction'>('business')
  const [qrCodes, setQrCodes] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    locationName: '',
    customData: ''
  })

  const router = useRouter()

  useEffect(() => {
    checkAuth()
    fetchBusinesses()
  }, [])

  useEffect(() => {
    if (selectedBusiness) {
      fetchQRCodes()
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

  const fetchQRCodes = async () => {
    if (!selectedBusiness) return
    
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/qr/business/${selectedBusiness}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      const data = await response.json()
      if (data.success) {
        setQrCodes(data.data)
      }
    } catch (error) {
      console.error('Failed to load QR codes:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBusiness) return

    setGenerating(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/qr/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          businessId: selectedBusiness,
          type: qrType,
          name: formData.name,
          description: formData.description,
          metadata: {
            locationName: formData.locationName,
            customData: formData.customData
          }
        })
      })

      const data = await response.json()
      
      if (data.success) {
        toast.success('QR Code generated successfully!')
        setFormData({ name: '', description: '', locationName: '', customData: '' })
        fetchQRCodes()
      } else {
        toast.error(data.error || 'Failed to generate QR code')
      }
    } catch (error) {
      toast.error('Failed to generate QR code')
    } finally {
      setGenerating(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('URL copied to clipboard!')
  }

  const downloadQRCode = (qrCode: any) => {
    const link = document.createElement('a')
    link.href = qrCode.qr_image
    link.download = `qr-${qrCode.name || qrCode.code}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('QR Code downloaded!')
  }

  const handleDelete = async (qrCodeId: string) => {
    if (!confirm('Are you sure you want to delete this QR code?')) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/qr/${qrCodeId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      const data = await response.json()
      
      if (data.success) {
        toast.success('QR code deleted successfully!')
        fetchQRCodes()
      } else {
        toast.error(data.error || 'Failed to delete QR code')
      }
    } catch (error) {
      toast.error('Failed to delete QR code')
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
            <h1 className="text-2xl font-bold text-gray-text">QR Code Generator</h1>
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

        {/* Generate QR Code Form */}
        {selectedBusiness && (
          <div className="card mb-6">
            <h3 className="text-lg font-semibold text-gray-text mb-4">Generate New QR Code</h3>
            
            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-text mb-2">
                  QR Code Type
                </label>
                <select
                  value={qrType}
                  onChange={(e) => setQrType(e.target.value as any)}
                  className="input-field"
                >
                  <option value="business">Business-wide (Main entrance, marketing)</option>
                  <option value="location">Location-specific (Different departments/areas)</option>
                  <option value="transaction">Transaction-based (Per customer/order)</option>
                </select>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-text mb-2">
                    QR Code Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="input-field"
                    placeholder="e.g., Main Entrance, Table 5"
                    required
                  />
                </div>

                {qrType === 'location' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-text mb-2">
                      Location Name
                    </label>
                    <input
                      type="text"
                      value={formData.locationName}
                      onChange={(e) => setFormData({...formData, locationName: e.target.value})}
                      className="input-field"
                      placeholder="e.g., Downtown Branch, Patio Area"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-text mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="input-field h-20 resize-none"
                  placeholder="Add notes about this QR code..."
                />
              </div>

              <button
                type="submit"
                disabled={generating}
                className="btn-primary flex items-center"
              >
                {generating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <QrCode className="w-4 h-4 mr-2" />
                    Generate QR Code
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* QR Codes List */}
        {selectedBusiness && (
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-text mb-4">Your QR Codes</h3>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-gray-muted mt-2">Loading QR codes...</p>
              </div>
            ) : qrCodes.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {qrCodes.map((qr) => (
                  <div key={qr.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="mb-3">
                      {qr.qr_image ? (
                        <img 
                          src={qr.qr_image} 
                          alt={qr.name}
                          className="w-full h-48 object-contain bg-white rounded"
                        />
                      ) : (
                        <div className="w-full h-48 bg-gray-100 rounded flex items-center justify-center">
                          <QrCode className="w-16 h-16 text-gray-400" />
                        </div>
                      )}
                    </div>
                    
                    <h4 className="font-medium text-gray-text mb-1">{qr.name}</h4>
                    <p className="text-xs text-gray-muted mb-2">
                      Type: <span className="capitalize">{qr.type}</span> • 
                      Scans: {qr.scan_count || 0}
                    </p>
                    
                    {qr.description && (
                      <p className="text-sm text-gray-muted mb-3">{qr.description}</p>
                    )}
                    
                    <div className="space-y-2">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => copyToClipboard(`${window.location.origin}/review/${qr.code}`)}
                          className="btn-secondary text-sm flex items-center flex-1"
                        >
                          <Copy className="w-3 h-3 mr-1" />
                          Copy URL
                        </button>
                        <button
                          onClick={() => downloadQRCode(qr)}
                          className="btn-primary text-sm flex items-center flex-1"
                        >
                          <Download className="w-3 h-3 mr-1" />
                          Download
                        </button>
                      </div>
                      <button
                        onClick={() => handleDelete(qr.id)}
                        className="btn-neutral text-sm text-warning hover:bg-warning/10 w-full"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <QrCode className="w-16 h-16 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-muted">No QR codes yet. Generate your first one!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

