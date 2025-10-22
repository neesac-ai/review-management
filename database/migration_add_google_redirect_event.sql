-- Migration: Add 'google_redirect' to event_type enum
-- This tracks when users click to open Google Reviews (best proxy for actual Google review posts)

-- Step 1: Add the new value to the enum type
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'google_redirect';

-- Step 2: Verify the update
-- Run this to check all enum values:
-- SELECT unnest(enum_range(NULL::event_type)) AS event_types;

-- Note: The 'IF NOT EXISTS' clause requires PostgreSQL 9.1+
-- If you're on an older version, you may get an error if the value already exists.
-- In that case, just ignore the error or check first with:
-- SELECT enum_range(NULL::event_type);

