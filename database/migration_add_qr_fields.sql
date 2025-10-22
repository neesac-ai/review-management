-- Add missing columns to qr_codes table

-- Add name column
ALTER TABLE qr_codes 
ADD COLUMN IF NOT EXISTS name VARCHAR(255);

-- Add description column
ALTER TABLE qr_codes 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add qr_image column (to store the base64 image data)
ALTER TABLE qr_codes 
ADD COLUMN IF NOT EXISTS qr_image TEXT;

-- Update existing records to have default names
UPDATE qr_codes 
SET name = CONCAT('QR Code ', type)
WHERE name IS NULL;

-- Add index on name for better search performance
CREATE INDEX IF NOT EXISTS idx_qr_codes_name ON qr_codes(name);

-- Verify the changes
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'qr_codes' 
ORDER BY ordinal_position;

