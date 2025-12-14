-- Align appointments table with application code
-- 1. Rename columns to match TypeScript interfaces
ALTER TABLE appointments 
  RENAME COLUMN quantity TO units;

ALTER TABLE appointments 
  RENAME COLUMN locked_price TO total_cost;

-- 2. Convert date to pure DATE type to avoid timezone issues in calendar
ALTER TABLE appointments 
  ALTER COLUMN date TYPE date USING date::date;

-- 3. Add check constraint for status consistency
ALTER TABLE appointments 
  ADD CONSTRAINT appointments_status_check 
  CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled'));

-- 4. Reload schema cache (function usually runs automatically on DDL, but good to be safe if running via raw SQL)
NOTIFY pgrst, 'reload schema';
