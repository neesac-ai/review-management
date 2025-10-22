-- Review Automation Platform Database Schema
-- For Supabase PostgreSQL

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_role AS ENUM ('super_admin', 'business_owner', 'manager');
CREATE TYPE qr_type AS ENUM ('business', 'location', 'transaction');
CREATE TYPE template_status AS ENUM ('draft', 'approved', 'active', 'archived');
CREATE TYPE feedback_status AS ENUM ('new', 'in_progress', 'resolved');
CREATE TYPE event_type AS ENUM ('scan', 'thumbs_up', 'thumbs_down', 'copy_review', 'submit_feedback', 'google_redirect');

-- Clients table (business owners using the platform)
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'business_owner',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Businesses table (individual business locations)
CREATE TABLE businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    google_place_id VARCHAR(255),
    logo_url TEXT,
    primary_color VARCHAR(7) DEFAULT '#2e9cca',
    secondary_color VARCHAR(7) DEFAULT '#4a4a66',
    email_notifications BOOLEAN DEFAULT true,
    notification_email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Review categories table
CREATE TABLE review_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(business_id, name)
);

-- Review templates table (AI-generated reviews)
CREATE TABLE review_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    category_id UUID REFERENCES review_categories(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    seo_keywords TEXT[] NOT NULL DEFAULT '{}',
    seo_score INTEGER DEFAULT 0,
    status template_status NOT NULL DEFAULT 'draft',
    word_count INTEGER DEFAULT 50,
    is_manual BOOLEAN DEFAULT false,
    times_shown INTEGER DEFAULT 0,
    times_copied INTEGER DEFAULT 0,
    conversion_rate DECIMAL(5,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- QR codes table
CREATE TABLE qr_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    code VARCHAR(255) UNIQUE NOT NULL,
    type qr_type NOT NULL,
    name VARCHAR(255),
    description TEXT,
    qr_image TEXT,
    metadata JSONB,
    scan_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Feedback table (negative reviews)
CREATE TABLE feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    qr_code_id UUID REFERENCES qr_codes(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    content TEXT NOT NULL,
    additional_comments TEXT,
    status feedback_status NOT NULL DEFAULT 'new',
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics table (tracking events)
CREATE TABLE analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    qr_code_id UUID REFERENCES qr_codes(id) ON DELETE SET NULL,
    event_type event_type NOT NULL,
    metadata JSONB,
    review_content TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI model configurations table (per business)
-- Note: We removed the ai_models table as we now fetch models dynamically from providers
CREATE TABLE ai_model_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    model_name VARCHAR(100) NOT NULL,
    provider VARCHAR(50) NOT NULL,
    api_key TEXT NOT NULL,
    model VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Note: We no longer insert default AI models as they are fetched dynamically from providers

-- Create indexes for better performance
CREATE INDEX idx_businesses_client_id ON businesses(client_id);
CREATE INDEX idx_review_categories_business_id ON review_categories(business_id);
CREATE INDEX idx_review_templates_business_id ON review_templates(business_id);
CREATE INDEX idx_review_templates_category_id ON review_templates(category_id);
CREATE INDEX idx_review_templates_status ON review_templates(status);
CREATE INDEX idx_qr_codes_business_id ON qr_codes(business_id);
CREATE INDEX idx_qr_codes_code ON qr_codes(code);
CREATE INDEX idx_feedback_business_id ON feedback(business_id);
CREATE INDEX idx_feedback_created_at ON feedback(created_at);
CREATE INDEX idx_analytics_business_id ON analytics(business_id);
CREATE INDEX idx_analytics_created_at ON analytics(created_at);
CREATE INDEX idx_analytics_event_type ON analytics(event_type);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_businesses_updated_at BEFORE UPDATE ON businesses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_review_templates_updated_at BEFORE UPDATE ON review_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_qr_codes_updated_at BEFORE UPDATE ON qr_codes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for clients
CREATE POLICY "Users can view own profile" ON clients FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON clients FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for businesses
CREATE POLICY "Users can view own businesses" ON businesses FOR SELECT USING (client_id = auth.uid());
CREATE POLICY "Users can insert own businesses" ON businesses FOR INSERT WITH CHECK (client_id = auth.uid());
CREATE POLICY "Users can update own businesses" ON businesses FOR UPDATE USING (client_id = auth.uid());
CREATE POLICY "Users can delete own businesses" ON businesses FOR DELETE USING (client_id = auth.uid());

-- RLS Policies for review_templates
CREATE POLICY "Users can view templates for own businesses" ON review_templates FOR SELECT USING (
    business_id IN (SELECT id FROM businesses WHERE client_id = auth.uid())
);
CREATE POLICY "Users can insert templates for own businesses" ON review_templates FOR INSERT WITH CHECK (
    business_id IN (SELECT id FROM businesses WHERE client_id = auth.uid())
);
CREATE POLICY "Users can update templates for own businesses" ON review_templates FOR UPDATE USING (
    business_id IN (SELECT id FROM businesses WHERE client_id = auth.uid())
);
CREATE POLICY "Users can delete templates for own businesses" ON review_templates FOR DELETE USING (
    business_id IN (SELECT id FROM businesses WHERE client_id = auth.uid())
);

-- RLS Policies for qr_codes
CREATE POLICY "Users can view QR codes for own businesses" ON qr_codes FOR SELECT USING (
    business_id IN (SELECT id FROM businesses WHERE client_id = auth.uid())
);
CREATE POLICY "Users can insert QR codes for own businesses" ON qr_codes FOR INSERT WITH CHECK (
    business_id IN (SELECT id FROM businesses WHERE client_id = auth.uid())
);
CREATE POLICY "Users can update QR codes for own businesses" ON qr_codes FOR UPDATE USING (
    business_id IN (SELECT id FROM businesses WHERE client_id = auth.uid())
);
CREATE POLICY "Users can delete QR codes for own businesses" ON qr_codes FOR DELETE USING (
    business_id IN (SELECT id FROM businesses WHERE client_id = auth.uid())
);

-- RLS Policies for feedback
CREATE POLICY "Users can view feedback for own businesses" ON feedback FOR SELECT USING (
    business_id IN (SELECT id FROM businesses WHERE client_id = auth.uid())
);
CREATE POLICY "Anyone can insert feedback" ON feedback FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update feedback for own businesses" ON feedback FOR UPDATE USING (
    business_id IN (SELECT id FROM businesses WHERE client_id = auth.uid())
);

-- RLS Policies for analytics
CREATE POLICY "Users can view analytics for own businesses" ON analytics FOR SELECT USING (
    business_id IN (SELECT id FROM businesses WHERE client_id = auth.uid())
);
CREATE POLICY "Anyone can insert analytics" ON analytics FOR INSERT WITH CHECK (true);

-- Public access for QR code lookups (customer-facing)
CREATE POLICY "Public can view QR codes" ON qr_codes FOR SELECT USING (true);
CREATE POLICY "Public can view businesses for QR codes" ON businesses FOR SELECT USING (true);


