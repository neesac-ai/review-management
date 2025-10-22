# ReviewBot - AI-Powered Review Automation Platform

A comprehensive SaaS platform that automates customer review collection using AI-generated, SEO-optimized content. Customers scan QR codes, choose thumbs up/down, and receive AI-generated reviews to copy-paste to Google or submit internal feedback.

## 🚀 Features

### For Business Owners
- **AI Review Generation**: Create SEO-optimized reviews using multiple AI models (OpenAI, Claude, Groq, Gemini)
- **Dynamic Model Discovery**: Automatically fetches latest AI models from all providers in real-time
- **Review Playground**: Interactive interface to generate, approve, and manage review templates
- **QR Code Generator**: Create business-wide, location-specific, or transaction-based QR codes
- **Analytics Dashboard**: Track scans, conversions, ratings, and customer feedback
- **Multi-Business Support**: Manage multiple business locations from one account
- **Branding Customization**: Custom logos, colors, and business settings

### For Customers
- **Simple QR Scan**: Scan QR code and choose thumbs up or down
- **AI-Generated Reviews**: Receive authentic, SEO-optimized reviews to copy-paste
- **Google Integration**: Direct links to Google Reviews with pre-filled content
- **Internal Feedback**: Submit constructive feedback for business improvement

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript
- **Database**: Supabase (PostgreSQL with real-time features)
- **AI Integration**: Multi-model support (OpenAI, Anthropic, Groq, Google)
- **Authentication**: JWT with Supabase Auth
- **Hosting**: Hostinger VPS with Nginx, PM2

### Database Schema
- `clients` - Business owners using the platform
- `businesses` - Individual business locations
- `review_templates` - AI-generated approved reviews
- `qr_codes` - Generated QR codes with metadata
- `feedback` - Customer feedback submissions
- `analytics` - Event tracking and metrics

## 🛠️ Installation

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account
- AI API keys (OpenAI, Anthropic, Groq, or Google)

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd review-automation
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Environment Configuration**
   ```bash
   cp env.example .env
   ```
   
   Fill in your environment variables:
   ```env
   # Database
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   
   # JWT
   JWT_SECRET=your_jwt_secret_key
   
   # AI API Keys
   OPENAI_API_KEY=your_openai_api_key
   ANTHROPIC_API_KEY=your_anthropic_api_key
   GROQ_API_KEY=your_groq_api_key
   GEMINI_API_KEY=your_gemini_api_key
   
   # Email
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_app_password
   
   # Server
   PORT=3001
   NODE_ENV=development
   FRONTEND_URL=http://localhost:3000
   ```

4. **Database Setup**
   - Create a new Supabase project
   - Run the SQL schema from `database/schema.sql`
   - Update your Supabase credentials in `.env`

5. **Development**
   ```bash
   # Start both frontend and backend
   npm run dev
   
   # Or start individually
   npm run dev:frontend  # Frontend on http://localhost:3000
   npm run dev:backend   # Backend on http://localhost:3001
   ```

## 📱 Usage

### For Business Owners

1. **Register & Setup**
   - Create account at `/register`
   - Add business information
   - Configure Google Place ID

2. **Generate Reviews**
   - Go to Review Playground
   - Enter business context and SEO keywords
   - Choose AI model and generate reviews
   - Approve and activate templates

3. **Create QR Codes**
   - Generate QR codes for your business
   - Choose type: business-wide, location-specific, or transaction-based
   - Customize branding and download

4. **Monitor Performance**
   - View analytics dashboard
   - Track conversion rates
   - Manage customer feedback

### For Customers

1. **Scan QR Code**
   - Customer scans QR code with phone
   - Sees business branding and simple interface

2. **Choose Experience**
   - Thumbs Up: Get AI-generated review to copy-paste to Google
   - Thumbs Down: Submit internal feedback for business improvement

3. **Leave Review**
   - Copy AI-generated review
   - Paste on Google Reviews
   - Submit and help the business

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh token

### Reviews
- `POST /api/reviews/generate` - Generate AI reviews
- `GET /api/reviews/templates/:businessId` - Get review templates
- `POST /api/reviews/templates` - Save review template
- `PUT /api/reviews/templates/:id` - Update template status
- `DELETE /api/reviews/templates/:id` - Delete template

### QR Codes
- `POST /api/qr/generate` - Generate QR code
- `GET /api/qr/:qrCodeId` - Get QR code info
- `GET /api/qr/business/:businessId` - Get business QR codes
- `GET /api/qr/analytics/:qrCodeId` - Get QR analytics

### Feedback
- `POST /api/feedback/submit` - Submit customer feedback
- `GET /api/feedback/business/:businessId` - Get business feedback
- `PUT /api/feedback/:feedbackId` - Update feedback status
- `GET /api/feedback/stats/:businessId` - Get feedback statistics

### Analytics
- `GET /api/analytics/dashboard/:businessId` - Get dashboard metrics
- `GET /api/analytics/export/:businessId` - Export analytics data
- `GET /api/analytics/qr/:qrCodeId` - Get QR-specific analytics

## 🎨 Design System

### Colors
- Primary Blue: `#2e9cca`
- Dark Gray/Purple: `#4a4a66`
- Heading Text: `#1f2937`
- Paragraph Text: `#6b7280`
- Body Background: `#f8fafc`
- Header Gradient: `linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)`

### Components
- Buttons: Primary, Secondary, Success, Warning, Neutral variants
- Cards: White background with subtle shadows
- Input Fields: Consistent styling with focus states
- Responsive design for mobile and desktop

## 🚀 Deployment

### Hostinger VPS Setup

1. **Server Preparation**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Install PM2
   sudo npm install -g pm2
   
   # Install Nginx
   sudo apt install nginx -y
   ```

2. **Application Deployment**
   ```bash
   # Clone repository
   git clone <repository-url>
   cd review-automation
   
   # Install dependencies
   npm run install:all
   
   # Build applications
   npm run build
   
   # Start with PM2
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```

3. **Nginx Configuration**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
       
       location /api {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

4. **SSL Certificate**
   ```bash
   # Install Certbot
   sudo apt install certbot python3-certbot-nginx -y
   
   # Get SSL certificate
   sudo certbot --nginx -d your-domain.com
   ```

## 📊 Monitoring

### PM2 Monitoring
```bash
# View processes
pm2 list

# View logs
pm2 logs

# Restart application
pm2 restart all

# Monitor resources
pm2 monit
```

### Nginx Logs
```bash
# Access logs
sudo tail -f /var/log/nginx/access.log

# Error logs
sudo tail -f /var/log/nginx/error.log
```

## 🔒 Security

- JWT authentication with refresh tokens
- Rate limiting on API endpoints
- Input validation and sanitization
- CORS configuration
- Helmet.js security headers
- Row Level Security (RLS) in Supabase

## 📈 Performance

- Database indexing for fast queries
- Rate limiting to prevent abuse
- Image optimization for QR codes
- Caching strategies for static content
- PM2 cluster mode for backend scaling

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📚 Documentation

- [Dynamic Model Fetching Guide](docs/DYNAMIC_MODEL_FETCHING.md) - How real-time AI model discovery works
- [API Documentation](docs/API.md) - Complete API reference (coming soon)
- [Deployment Guide](docs/DEPLOYMENT.md) - Detailed deployment instructions (coming soon)

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support, email support@neesac.ai or create an issue in the repository.

---

**Built with ❤️ by neesac.ai**




