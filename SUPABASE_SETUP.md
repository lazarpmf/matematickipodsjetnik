# Supabase Setup Instructions

## Database Schema

Run these SQL commands in your Supabase SQL Editor:

### 1. Create lessons table

```sql
CREATE TABLE lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  grade INTEGER NOT NULL CHECK (grade >= 6 AND grade <= 9),
  pdf_path TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT ARRAY['#matematika'],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public can read lessons"
  ON lessons FOR SELECT
  USING (true);

-- Admin write access (will be updated after user_roles table is created)
CREATE POLICY "Admins can insert lessons"
  ON lessons FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update lessons"
  ON lessons FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete lessons"
  ON lessons FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_lessons_updated_at
  BEFORE UPDATE ON lessons
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 1a. Add tags to existing lessons table (if already created)

```sql
ALTER TABLE lessons
ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT ARRAY['#matematika'];

UPDATE lessons
SET tags = ARRAY['#matematika']
WHERE tags IS NULL OR array_length(tags, 1) IS NULL;
```

### 2. Create visits table

```sql
CREATE TABLE visits (
  id BIGSERIAL PRIMARY KEY,
  visited_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;

-- Public can insert visits
CREATE POLICY "Public can insert visits"
  ON visits FOR INSERT
  WITH CHECK (true);

-- Admins can read visits
CREATE POLICY "Admins can read visits"
  ON visits FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );
```

### 3. Create user_roles table

```sql
CREATE TABLE user_roles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Users can read their own role
CREATE POLICY "Users can read own role"
  ON user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- Only service role can insert/update (manual admin creation)
-- This is handled via Supabase dashboard or service role key
```

### 4. Create Storage Bucket

1. Go to Storage in Supabase dashboard
2. Create a new bucket named `lesson_pdfs`
3. Set it to **Public** (or use signed URLs if preferred)
4. Add storage policies:

```sql
-- Allow public read access
CREATE POLICY "Public can read PDFs"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'lesson_pdfs');

-- Allow admins to upload
CREATE POLICY "Admins can upload PDFs"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'lesson_pdfs' AND
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Allow admins to delete
CREATE POLICY "Admins can delete PDFs"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'lesson_pdfs' AND
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );
```

## Creating an Admin User

1. Create a user via Supabase Auth dashboard or API
2. Get the user's UUID
3. Insert into user_roles table:

```sql
INSERT INTO user_roles (user_id, role)
VALUES ('user-uuid-here', 'admin');
```

## Environment Variables

Copy `.env.local.example` to `.env.local` and fill in your Supabase credentials from the project settings.
