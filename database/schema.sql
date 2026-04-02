-- ============================================
-- Smart Attendance System — Supabase Schema
-- ============================================
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- 1. Students Table
CREATE TABLE IF NOT EXISTS students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  student_id TEXT UNIQUE NOT NULL,
  email TEXT,
  face_descriptor JSONB,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Attendance Table
CREATE TABLE IF NOT EXISTS attendance (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  student_uuid UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  student_name TEXT NOT NULL,
  student_id TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  check_in TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT DEFAULT 'present' CHECK (status IN ('present', 'late', 'absent')),
  confidence REAL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_uuid, date)
);

-- 3. Settings Table (admin config)
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Indexes for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(student_uuid);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance(status);
CREATE INDEX IF NOT EXISTS idx_students_student_id ON students(student_id);

-- ============================================
-- Default settings
-- ============================================
INSERT INTO settings (key, value) VALUES
  ('late_threshold', '"09:10"'::jsonb),
  ('class_start_time', '"09:00"'::jsonb),
  ('institution_name', '"Smart Attendance System"'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- Row Level Security (RLS)
-- ============================================
-- Enable RLS on all tables
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Allow all operations via service_role key (backend)
CREATE POLICY "Service role full access on students"
  ON students FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access on attendance"
  ON attendance FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access on settings"
  ON settings FOR ALL
  USING (true)
  WITH CHECK (true);

-- Allow anon read access (frontend dashboard)
CREATE POLICY "Anon read students"
  ON students FOR SELECT
  USING (true);

CREATE POLICY "Anon read attendance"
  ON attendance FOR SELECT
  USING (true);

CREATE POLICY "Anon read settings"
  ON settings FOR SELECT
  USING (true);
