-- ⚠️ WARNING: This changes the database timezone to IST
-- This is NOT recommended as best practice is to store UTC in database
-- Only run this if you're sure you want to change from UTC to IST

-- Set database timezone to IST (Asia/Kolkata)
ALTER DATABASE postgres SET timezone TO 'Asia/Kolkata';

-- You need to reconnect for this to take effect
-- Or run for current session:
SET timezone TO 'Asia/Kolkata';

-- Verify timezone
SHOW timezone;

-- Note: Existing timestamps in the database are stored as UTC
-- They will be displayed in IST but the underlying storage remains UTC
-- New inserts will use IST as the default timezone

-- If you want to see all timestamps in IST format:
-- SELECT created_at AT TIME ZONE 'Asia/Kolkata' as created_at_ist FROM your_table;

