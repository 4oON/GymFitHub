-- Add date field to workouts table
-- This field stores the actual workout date (can be different from createdAt)

-- Step 1: Add the date column (nullable)
ALTER TABLE workouts ADD COLUMN IF NOT EXISTS date TIMESTAMP WITH TIME ZONE;

-- Step 2: Populate existing records with createdAt as default
UPDATE workouts SET date = created_at WHERE date IS NULL;

-- Step 3: Verify the changes
SELECT 
    id,
    name,
    date,
    created_at,
    CASE 
        WHEN date IS NULL THEN '❌ NULL'
        ELSE '✅ Has date'
    END as date_status
FROM workouts
ORDER BY created_at DESC
LIMIT 10;

-- Step 4: Show statistics
SELECT 
    COUNT(*) as total_workouts,
    COUNT(date) as workouts_with_date,
    COUNT(*) - COUNT(date) as workouts_without_date
FROM workouts;