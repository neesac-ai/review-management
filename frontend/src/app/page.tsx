import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-light">
      <div className="header-gradient py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-text mb-4">
              Welcome to <span className="text-primary">ReviewBot</span>
            </h1>
            <p className="text-xl text-gray-muted mb-8">
              AI-powered review automation for your business
            </p>
            <div className="flex justify-center space-x-4">
              <Link href="/login" className="btn-primary">
                Login
              </Link>
              <Link href="/register" className="btn-secondary">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-text mb-4">
              How ReviewBot Works
            </h2>
            <p className="text-lg text-gray-muted">
              Transform your customer feedback process with AI
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="card text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📱</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">1. Customer Scans QR</h3>
              <p className="text-gray-muted">
                Customers scan your QR code and choose thumbs up or down
              </p>
            </div>
            
            <div className="card text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🤖</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">2. AI Generates Review</h3>
              <p className="text-gray-muted">
                Our AI creates SEO-optimized, authentic reviews for your customers
              </p>
            </div>
            
            <div className="card text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⭐</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">3. Reviews Go Live</h3>
              <p className="text-gray-muted">
                Happy customers post to Google, feedback goes to your dashboard
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}




