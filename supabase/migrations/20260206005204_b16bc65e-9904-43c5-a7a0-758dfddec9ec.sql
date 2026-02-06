-- =============================================
-- FIX 1: Video Storage Bucket - Make Private
-- =============================================

-- Update the videos bucket to be private
UPDATE storage.buckets SET public = false WHERE id = 'videos';

-- Drop all existing video-related policies to start fresh
DROP POLICY IF EXISTS "Anyone can view videos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view approved videos" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all videos" ON storage.objects;
DROP POLICY IF EXISTS "Moderators can view all videos" ON storage.objects;

-- Create secure policy: Users can view their own videos OR approved videos
CREATE POLICY "Authenticated users can view approved videos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'videos' AND
  auth.role() = 'authenticated' AND
  (
    -- User can always view their own uploads
    auth.uid()::text = (storage.foldername(name))[1]
    OR
    -- Or approved videos
    EXISTS (
      SELECT 1 FROM shorts s
      WHERE s.is_approved = true
      AND s.video_url LIKE '%' || name || '%'
    )
  )
);

-- Create admin policy for viewing all videos
CREATE POLICY "Admins can view all videos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'videos' AND
  public.has_role(auth.uid(), 'admin')
);

-- Create moderator policy for viewing all videos
CREATE POLICY "Moderators can view all videos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'videos' AND
  public.has_role(auth.uid(), 'moderator')
);

-- =============================================
-- FIX 2: Prevent Direct XP/Streak Manipulation
-- =============================================

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS check_xp_manipulation ON profiles;

-- Create trigger function to prevent direct XP/streak manipulation
CREATE OR REPLACE FUNCTION public.prevent_xp_manipulation()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if protected fields were modified by comparing old vs new values
  IF (OLD.xp IS DISTINCT FROM NEW.xp 
      OR OLD.streak IS DISTINCT FROM NEW.streak 
      OR OLD.last_activity_date IS DISTINCT FROM NEW.last_activity_date) THEN
    -- Only allow changes from SECURITY DEFINER functions (which run as the function owner)
    -- Regular user updates will fail this check
    IF current_setting('role', true) = 'authenticated' THEN
      RAISE EXCEPTION 'XP, streak, and activity tracking can only be modified through system functions';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create the trigger on the profiles table
CREATE TRIGGER check_xp_manipulation
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_xp_manipulation();