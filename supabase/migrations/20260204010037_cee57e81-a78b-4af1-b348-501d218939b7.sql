-- Ensure videos bucket exists and is PUBLIC
INSERT INTO storage.buckets (id, name, public)
VALUES ('videos', 'videos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Create permissive storage policies for video uploads
DROP POLICY IF EXISTS "Anyone can view videos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own videos" ON storage.objects;

-- Public read access for all videos
CREATE POLICY "Anyone can view videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'videos');

-- Authenticated users can upload to their folder
CREATE POLICY "Authenticated users can upload videos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can update their own videos
CREATE POLICY "Users can update own videos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can delete their own videos
CREATE POLICY "Users can delete own videos"
ON storage.objects FOR DELETE
USING (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]);