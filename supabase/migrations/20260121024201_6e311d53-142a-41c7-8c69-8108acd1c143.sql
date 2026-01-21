-- ============================================
-- SECURITY FIX: Profiles - Friends-only visibility
-- ============================================

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Create friends-only visibility policy (users can view own profile + friends' profiles)
CREATE POLICY "Users can view own and friends profiles"
  ON public.profiles FOR SELECT
  USING (
    auth.uid() = id OR
    EXISTS (
      SELECT 1 FROM friendships f
      WHERE f.status = 'accepted' AND
      ((f.requester_id = auth.uid() AND f.addressee_id = profiles.id) OR
       (f.addressee_id = auth.uid() AND f.requester_id = profiles.id))
    )
  );

-- ============================================
-- SECURITY FIX: Admin RLS policies for shorts
-- ============================================

-- Add policy for admins to approve/update any shorts
CREATE POLICY "Admins can update any shorts"
  ON public.shorts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('admin', 'moderator')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('admin', 'moderator')
    )
  );

-- Add policy for admins to delete any shorts
CREATE POLICY "Admins can delete any shorts"
  ON public.shorts FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('admin', 'moderator')
    )
  );

-- ============================================
-- SECURITY FIX: Race conditions - Use triggers
-- ============================================

-- Create trigger function for likes count
CREATE OR REPLACE FUNCTION public.update_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE shorts SET likes_count = likes_count + 1
    WHERE id = NEW.short_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE shorts SET likes_count = GREATEST(0, likes_count - 1)
    WHERE id = OLD.short_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for likes
DROP TRIGGER IF EXISTS likes_count_trigger ON likes;
CREATE TRIGGER likes_count_trigger
  AFTER INSERT OR DELETE ON likes
  FOR EACH ROW
  EXECUTE FUNCTION update_likes_count();

-- Create trigger function for views count
CREATE OR REPLACE FUNCTION public.update_views_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE shorts SET views_count = views_count + 1
    WHERE id = NEW.short_id;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for views
DROP TRIGGER IF EXISTS views_count_trigger ON short_views;
CREATE TRIGGER views_count_trigger
  AFTER INSERT ON short_views
  FOR EACH ROW
  EXECUTE FUNCTION update_views_count();

-- ============================================
-- SECURITY FIX: Storage bucket - Make private
-- ============================================

-- Update bucket to private
UPDATE storage.buckets SET public = false WHERE id = 'videos';

-- Drop the permissive select policy
DROP POLICY IF EXISTS "Anyone can view videos" ON storage.objects;

-- Create policy for authenticated users to view approved videos
-- Users can view videos for shorts that are approved
CREATE POLICY "Authenticated users can view approved videos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'videos' AND
    auth.role() = 'authenticated' AND
    (
      -- Owner can always view their own videos
      auth.uid()::text = (storage.foldername(name))[1]
      OR
      -- Anyone can view videos from approved shorts
      EXISTS (
        SELECT 1 FROM shorts s
        WHERE s.is_approved = true
        AND s.video_url LIKE '%' || name || '%'
      )
    )
  );

-- Admins can view all videos for moderation
CREATE POLICY "Admins can view all videos"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'videos' AND
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('admin', 'moderator')
    )
  );