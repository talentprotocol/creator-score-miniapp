-- Migration: Add rewards tracking columns to user_preferences table
-- This enables database-first storage for Pay It Forward badge calculations
-- 
-- Status: ✅ APPLIED (via Supabase MCP on 2025-08-25)
-- Purpose: Store calculated rewards amounts for opted-out users to eliminate
--          expensive real-time API calculations and improve badge performance

-- Add rewards amount column (the amount user is donating by opting out)
ALTER TABLE user_preferences 
ADD COLUMN IF NOT EXISTS rewards_amount DECIMAL(10,2) DEFAULT NULL;

-- Add timestamp for when rewards were last calculated
ALTER TABLE user_preferences 
ADD COLUMN IF NOT EXISTS rewards_calculated_at TIMESTAMP DEFAULT NULL;

-- Create index for efficient lookups by talent_uuid (likely already exists)
CREATE INDEX IF NOT EXISTS idx_user_preferences_talent_uuid 
ON user_preferences(talent_uuid);

-- Create index for efficient lookups of opted-out users with rewards
CREATE INDEX IF NOT EXISTS idx_user_preferences_rewards_optout 
ON user_preferences(rewards_optout, rewards_amount) 
WHERE rewards_optout = true;

-- Add comment to document the purpose of these columns
COMMENT ON COLUMN user_preferences.rewards_amount IS 
'The calculated reward amount that opted-out users are donating (in USD)';

COMMENT ON COLUMN user_preferences.rewards_calculated_at IS 
'Timestamp when the rewards amount was last calculated and stored';
