-- Migration: Add email notification settings to businesses table
-- Run this if your businesses table already exists

-- Add email_notifications column (default true)
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT true;

-- Add notification_email column
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS notification_email VARCHAR(255);

-- Add comment
COMMENT ON COLUMN businesses.email_notifications IS 'Whether to send email notifications for negative feedback';
COMMENT ON COLUMN businesses.notification_email IS 'Email address to receive notifications';

