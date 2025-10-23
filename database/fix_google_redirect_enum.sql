-- Fix google_redirect enum issue
-- This ensures the google_redirect event type is available

-- Add the google_redirect value to the enum if it doesn't exist
DO $$ 
BEGIN
    -- Check if google_redirect already exists in the enum
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'google_redirect' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'event_type')
    ) THEN
        -- Add the value if it doesn't exist
        ALTER TYPE event_type ADD VALUE 'google_redirect';
    END IF;
END $$;

-- Verify the enum values
SELECT unnest(enum_range(NULL::event_type)) AS event_types;

