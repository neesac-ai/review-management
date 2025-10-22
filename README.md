# ReviewBot - AI-Powered Review Automation System

A comprehensive SaaS platform that automates customer review collection using AI-generated content and QR code technology.

## 🚀 Features

### Core Functionality
- **QR Code Generation**: Create business-wide, location-specific, or transaction-specific QR codes
- **AI Review Generation**: Generate unique, SEO-optimized reviews using multiple AI providers
- **Category-Based Templates**: Organize reviews by service categories with customizable word counts
- **Google Review Integration**: Direct positive reviews to Google with copy-paste assistance
- **Internal Feedback System**: Capture negative feedback with Google-style forms
- **Real-time Analytics**: Track conversion rates, scan counts, and review performance

### AI Integration
- **Multiple Providers**: OpenAI, Anthropic, Groq, Google Gemini
- **Dynamic Model Fetching**: Real-time model discovery from provider APIs
- **Custom API Keys**: Client-configurable AI models and API keys
- **Unique Content**: AI generates unique reviews per scan to avoid duplication

### Business Management
- **Multi-tenant Architecture**: Support for multiple businesses and locations
- **Brand Customization**: Custom logos, colors, and business settings
- **User Management**: Role-based access control (Super Admin, Business Owner, Manager)
- **Analytics Dashboard**: Comprehensive metrics and data export

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **React Hot Toast** - Notifications
- **Lucide React** - Icons

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **TypeScript** - Type-safe development
- **JWT** - Authentication
- **Rate Limiting** - API protection

### Database
- **Supabase** - PostgreSQL database with real-time features
- **Row Level Security** - Data isolation
- **Authentication** - Built-in user management

### AI Services
- **OpenAI API** - GPT models
- **Anthropic API** - Claude models
- **Groq API** - Llama models
- **Google Gemini API** - Gemini models

## 📁 Project Structure

```
review-automation/
├── frontend/                 # Next.js frontend application
│   ├── src/app/             # App Router pages
│   │   ├── dashboard/       # Business dashboard
│   │   ├── review/[qrId]/   # Customer review pages
│   │   └── login/           # Authentication pages
│   ├── src/utils/           # Utility functions
│   └── package.json
├── backend/                 # Node.js backend API
│   ├── src/
│   │   ├── routes/          # API endpoints
│   │   ├── services/        # Business logic
│   │   └── middleware/       # Express middleware
│   └── package.json
├── database/                # Database schemas and migrations
│   ├── schema.sql           # Main database schema
│   └── migration_*.sql      # Database migrations
├── shared/                  # Shared TypeScript types
├── docs/                    # Documentation
└── package.json             # Root package.json
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- AI provider API keys (OpenAI, Anthropic, Groq, or Google)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/neesac-ai/review-management.git
   cd review-management
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   
   Update `.env` with your configuration:
   ```env
   # Supabase Configuration
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   
   # Frontend URL (for QR codes)
   FRONTEND_URL=http://localhost:3000
   
   # AI Provider API Keys (optional - can be configured in UI)
   OPENAI_API_KEY=your_openai_key
   ANTHROPIC_API_KEY=your_anthropic_key
   GROQ_API_KEY=your_groq_key
   GEMINI_API_KEY=your_gemini_key
   ```

4. **Set up the database**
   - Create a new Supabase project
   - Run the SQL scripts in `database/` folder:
     ```sql
     -- Run in order:
     -- 1. schema.sql (main schema)
     -- 2. migration_*.sql (any migrations)
     ```

5. **Start the development servers**
   ```bash
   npm run dev
   ```
   
   This starts both frontend (port 3000) and backend (port 3001) concurrently.

6. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

## 📖 Usage Guide

### For Business Owners

1. **Register & Login**
   - Create an account at `/register`
   - Login at `/login`

2. **Configure AI Models**
   - Go to Dashboard → AI Configuration
   - Select AI provider and model
   - Enter API key and test configuration

3. **Set up Business**
   - Go to Dashboard → Business Settings
   - Upload logo and set brand colors
   - Configure Google Place ID for reviews

4. **Create Review Templates**
   - Go to Dashboard → Review Playground
   - Create categories (e.g., "SEO", "Social Media")
   - Generate AI templates with specific word counts
   - Activate templates for customer use

5. **Generate QR Codes**
   - Go to Dashboard → QR Generator
   - Create QR codes for different purposes
   - Download and print QR codes

### For Customers

1. **Scan QR Code**
   - Customer scans QR code with phone camera
   - Opens review page automatically

2. **Choose Experience**
   - Click "Great Experience!" for positive feedback
   - Click "Needs Improvement" for negative feedback

3. **Positive Reviews**
   - Select category and review template
   - Click "Copy & Post" to copy review text
   - Opens Google Reviews to paste and submit

4. **Negative Feedback**
   - Fill out internal feedback form
   - Rate experience and provide details
   - Submit for business improvement

## 🔧 Configuration

### AI Model Configuration
The system supports multiple AI providers with dynamic model discovery:

- **OpenAI**: GPT-4, GPT-3.5-turbo
- **Anthropic**: Claude-3-sonnet, Claude-3-haiku
- **Groq**: Llama-3.3-70b, Llama-3.1-70b
- **Google**: Gemini Pro, Gemini Pro Vision

### Database Configuration
The system uses Supabase with the following main tables:
- `businesses` - Business information
- `users` - User accounts
- `qr_codes` - Generated QR codes
- `review_categories` - Service categories
- `review_templates` - AI-generated templates
- `analytics` - User interaction tracking
- `feedback` - Internal feedback submissions

## 📊 Analytics

The system tracks comprehensive analytics:
- **Scan Counts**: Total QR code scans
- **Conversion Rates**: Google reviews vs internal feedback
- **Template Performance**: Most used templates
- **Category Analytics**: Performance by service category
- **Time-based Metrics**: Peak usage times and trends

## 🚀 Deployment

### Production Deployment
1. **Set up production environment**
   ```bash
   # Update environment variables for production
   FRONTEND_URL=https://yourdomain.com
   SUPABASE_URL=your_production_supabase_url
   ```

2. **Build and deploy**
   ```bash
   npm run build
   npm start
   ```

3. **Database setup**
   - Run production database migrations
   - Set up Row Level Security policies
   - Configure authentication settings

### Hostinger VPS Deployment
The project includes deployment scripts for Hostinger VPS:
- `deploy.sh` - Automated deployment script
- `ecosystem.config.js` - PM2 configuration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Contact: support@neesac.ai
- Documentation: [docs/](docs/)

## 🏗️ Architecture

### System Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Customer      │    │   Business      │    │   Admin         │
│   (Mobile)      │    │   Dashboard     │    │   Panel         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Next.js Frontend                            │
│              (React + TypeScript + Tailwind)                   │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Node.js Backend                             │
│              (Express + TypeScript + JWT)                     │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Supabase Database                           │
│              (PostgreSQL + Real-time + Auth)                   │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    AI Providers                                 │
│    (OpenAI + Anthropic + Groq + Google Gemini)                │
└─────────────────────────────────────────────────────────────────┘
```

---

**Built with ❤️ by [neesac.ai](https://neesac.ai)**

*Product of neesac.ai - AI-powered solutions for modern businesses*