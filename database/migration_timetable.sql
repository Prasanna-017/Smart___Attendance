-- run this in your Supabase SQL Editor to allow multiple attendance marks per day!

-- 1. Drop the existing single-day constraint
ALTER TABLE attendance DROP CONSTRAINT IF EXISTS attendance_student_uuid_date_key;

-- 2. Add the session column (to track morning, break, lunch)
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS session TEXT DEFAULT 'morning';

-- 3. Add the new constraint allowing one session per day per student
ALTER TABLE attendance ADD CONSTRAINT attendance_student_uuid_date_session_key UNIQUE(student_uuid, date, session);
