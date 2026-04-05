-- Add missing location column to resource_submissions table
ALTER TABLE resource_submissions
ADD COLUMN IF NOT EXISTS location JSONB;

-- Ensure address can be optional in the future if needed, 
-- but for now keeping it NOT NULL as per original design 
-- while ensuring API provides empty string if blank.
