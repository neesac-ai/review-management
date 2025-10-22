// Shared TypeScript interfaces between frontend and backend

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'super_admin' | 'business_owner' | 'manager';
  created_at: string;
  updated_at: string;
}

export interface Business {
  id: string;
  client_id: string;
  name: string;
  description?: string;
  google_place_id?: string;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  created_at: string;
  updated_at: string;
}

export interface ReviewTemplate {
  id: string;
  business_id: string;
  content: string;
  seo_keywords: string[];
  seo_score: number;
  status: 'draft' | 'approved' | 'active' | 'archived';
  times_shown: number;
  times_copied: number;
  conversion_rate: number;
  created_at: string;
  updated_at: string;
}

export interface QRCode {
  id: string;
  business_id: string;
  code: string;
  type: 'business' | 'location' | 'transaction';
  metadata?: Record<string, any>;
  scan_count: number;
  created_at: string;
  updated_at: string;
}

export interface Feedback {
  id: string;
  business_id: string;
  qr_code_id?: string;
  rating: number;
  content: string;
  additional_comments?: string;
  status: 'new' | 'in_progress' | 'resolved';
  resolved_at?: string;
  created_at: string;
}

export interface Analytics {
  id: string;
  business_id: string;
  qr_code_id?: string;
  event_type: 'scan' | 'thumbs_up' | 'thumbs_down' | 'copy_review' | 'submit_feedback';
  metadata?: Record<string, any>;
  created_at: string;
}

export interface AIGenerationRequest {
  businessContext: string;
  keywords: string[];
  count: number;
  tone: 'professional' | 'casual' | 'enthusiastic';
  length: 'short' | 'medium' | 'long';
  aiModel?: 'openai' | 'anthropic' | 'groq' | 'gemini';
  model?: string; // Specific model name from database (e.g., llama-3.3-70b-versatile, gpt-4, etc.)
}

export interface AIGenerationResponse {
  reviews: {
    text: string;
    keywords_used: string[];
    seo_score: number;
  }[];
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  businessName: string;
}

export interface QRCodeGenerationRequest {
  businessId: string;
  type: 'business' | 'location' | 'transaction';
  metadata?: Record<string, any>;
  customLogo?: string;
  colorScheme?: {
    primary: string;
    secondary: string;
  };
}

export interface CustomerReviewRequest {
  qrCodeId: string;
  action: 'thumbs_up' | 'thumbs_down';
}

export interface CustomerFeedbackRequest {
  qrCodeId: string;
  rating: number;
  content: string;
  additionalComments?: string;
}

export interface DashboardMetrics {
  totalScans: number;
  thumbsUpCount: number;
  thumbsDownCount: number;
  googleConversionRate: number;
  averageRating: number;
  peakEngagementTimes: string[];
  locationPerformance: {
    locationId: string;
    locationName: string;
    scans: number;
    averageRating: number;
  }[];
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}


