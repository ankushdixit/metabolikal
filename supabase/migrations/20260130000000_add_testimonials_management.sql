-- =============================================================================
-- TESTIMONIALS MANAGEMENT TABLES
-- Adds tables for managing testimonial videos and before/after photos
-- =============================================================================

-- Table 1: testimonial_videos
-- Stores YouTube video testimonials (both shorts and landscape videos)
CREATE TABLE testimonial_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  youtube_video_id TEXT NOT NULL,        -- e.g., "GKbzoiKoQzM"
  title TEXT NOT NULL,                   -- Display title
  client_name TEXT,                      -- Optional client name
  video_type TEXT DEFAULT 'short' CHECK (video_type IN ('short', 'landscape')),
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 2: testimonial_photos
-- Stores before/after transformation photos
CREATE TABLE testimonial_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name TEXT NOT NULL,
  profession TEXT,                       -- e.g., "Lead Engineer"
  duration TEXT NOT NULL,                -- e.g., "3 months"
  result TEXT NOT NULL,                  -- e.g., "Lost 10kg"
  before_image_url TEXT NOT NULL,        -- Supabase Storage URL/path
  after_image_url TEXT NOT NULL,         -- Supabase Storage URL/path
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- For efficient querying of active items in display order
CREATE INDEX idx_testimonial_videos_active_order ON testimonial_videos (is_active, display_order);
CREATE INDEX idx_testimonial_photos_active_order ON testimonial_photos (is_active, display_order);

-- =============================================================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================================================

CREATE OR REPLACE FUNCTION update_testimonial_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_testimonial_videos_updated_at
  BEFORE UPDATE ON testimonial_videos
  FOR EACH ROW
  EXECUTE FUNCTION update_testimonial_updated_at();

CREATE TRIGGER trigger_testimonial_photos_updated_at
  BEFORE UPDATE ON testimonial_photos
  FOR EACH ROW
  EXECUTE FUNCTION update_testimonial_updated_at();

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

ALTER TABLE testimonial_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonial_photos ENABLE ROW LEVEL SECURITY;

-- Admin can do everything
CREATE POLICY "admin_all_testimonial_videos" ON testimonial_videos
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "admin_all_testimonial_photos" ON testimonial_photos
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Public can read active records (for landing page)
CREATE POLICY "public_read_active_testimonial_videos" ON testimonial_videos
  FOR SELECT USING (is_active = true);

CREATE POLICY "public_read_active_testimonial_photos" ON testimonial_photos
  FOR SELECT USING (is_active = true);

-- =============================================================================
-- STORAGE BUCKET FOR TESTIMONIAL PHOTOS
-- =============================================================================

-- Create the testimonials bucket (public for serving images)
INSERT INTO storage.buckets (id, name, public)
VALUES ('testimonials', 'testimonials', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for testimonials bucket
-- Admins can upload/update/delete
CREATE POLICY "admin_upload_testimonials"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'testimonials'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

CREATE POLICY "admin_update_testimonials"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'testimonials'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

CREATE POLICY "admin_delete_testimonials"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'testimonials'
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  )
);

-- Public can read (for displaying images on landing page)
CREATE POLICY "public_read_testimonials"
ON storage.objects FOR SELECT
USING (bucket_id = 'testimonials');

-- =============================================================================
-- SEED DATA - Migrate existing hardcoded videos
-- =============================================================================

-- Insert existing YouTube shorts
INSERT INTO testimonial_videos (youtube_video_id, title, video_type, display_order, is_active) VALUES
  ('GKbzoiKoQzM', 'Client Transformation Story', 'short', 1, true),
  ('QutRfBc9jM8', 'Client Transformation Story', 'short', 2, true),
  ('FASef8aqdfM', 'Client Transformation Story', 'short', 3, true),
  ('js1TlePCC7k', 'Client Transformation Story', 'short', 4, true),
  ('bCTPI9SvZC0', 'Client Transformation Story', 'short', 5, true),
  ('BTOZPZZi5Dk', 'Client Transformation Story', 'short', 6, true),
  ('JiI63Walf4g', 'Client Transformation Story', 'short', 7, true),
  ('4YWgnJoAH9w', 'Client Transformation Story', 'short', 8, true),
  ('KVeFo0IoBA8', 'Client Transformation Story', 'short', 9, true),
  ('kyxYUoQRE2M', 'Client Transformation Story', 'short', 10, true),
  ('uDpy1Gh8bjs', 'Client Transformation Story', 'short', 11, true),
  ('mfPiQjgGzbo', 'Client Transformation Story', 'short', 12, true);

-- Insert existing YouTube testimonials (landscape)
INSERT INTO testimonial_videos (youtube_video_id, title, video_type, display_order, is_active) VALUES
  ('K-HAAkZ1MzI', 'Client Testimonial', 'landscape', 13, true),
  ('KKejfj9_ZIA', 'Client Testimonial', 'landscape', 14, true),
  ('qsTew1fhnPY', 'Client Testimonial', 'landscape', 15, true);

-- Insert existing transformation photos
INSERT INTO testimonial_photos (client_name, profession, duration, result, before_image_url, after_image_url, display_order, is_active) VALUES
  ('Shivashish S.', 'Metabolikal Founder', '90 days', 'Went from 25% to 15% body fat. Lost 4kg fat', '/images/transformations/client1-before.jpg', '/images/transformations/client1-after.jpg', 1, true),
  ('Sandeep', 'Lead Engineer', '3 months', 'Gained 7.5kg', '/images/transformations/client2-before.jpg', '/images/transformations/client2-after.jpg', 2, true),
  ('Sumedha', 'IT Professional', '16 weeks', 'Lost 10kg', '/images/transformations/client3-before.jpg', '/images/transformations/client3-after.jpg', 3, true),
  ('Vikas', 'Doctor', '14 weeks', '2.5 months', '/images/transformations/client4-before.jpg', '/images/transformations/client4-after.jpg', 4, true),
  ('Aishwarya', 'Doctor', '6 months', 'Lost 20kg', '/images/transformations/client5-before.jpg', '/images/transformations/client5-after.jpg', 5, true),
  ('Abhijeet', '', '20 weeks', 'Lost 27kg', '/images/transformations/client6-before.jpg', '/images/transformations/client6-after.jpg', 6, true),
  ('Priti', '', '3 months', 'Lost 6kg body fat', '/images/transformations/client7-before.jpg', '/images/transformations/client7-after.jpg', 7, true);
