-- =============================================
-- FIX: Shorts Table - Restrict user_id exposure
-- =============================================

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can view approved shorts" ON public.shorts;

-- Create a new policy that requires authentication for viewing approved shorts
CREATE POLICY "Authenticated users can view approved shorts"
ON public.shorts FOR SELECT
USING (
  auth.role() = 'authenticated' AND is_approved = true
);

-- Create a SECURITY DEFINER function to serve public/starter feed
-- This allows unauthenticated users to see video content WITHOUT exposing user_id
CREATE OR REPLACE FUNCTION public.get_starter_feed(p_limit integer DEFAULT 10)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  video_url text,
  thumbnail_url text,
  category text,
  likes_count integer,
  views_count integer,
  difficulty_level text,
  ai_summary text,
  topics text[],
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.title,
    s.description,
    s.video_url,
    s.thumbnail_url,
    s.category,
    s.likes_count,
    s.views_count,
    s.difficulty_level,
    s.ai_summary,
    s.topics,
    s.created_at
  FROM shorts s
  WHERE s.is_approved = true
  ORDER BY s.views_count DESC, s.created_at DESC
  LIMIT p_limit;
END;
$$;

-- Also create a function for new user detection that doesn't expose user data
CREATE OR REPLACE FUNCTION public.is_new_user(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM short_views WHERE user_id = p_user_id LIMIT 1
  );
END;
$$;