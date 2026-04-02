-- Fix 1: Add auth check to search_users_by_username
CREATE OR REPLACE FUNCTION public.search_users_by_username(search_query text)
 RETURNS TABLE(id uuid, username text, avatar_url text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  search_query := replace(search_query, '\', '\\');
  search_query := replace(search_query, '%', '\%');
  search_query := replace(search_query, '_', '\_');
  
  RETURN QUERY
  SELECT p.id, p.username, p.avatar_url
  FROM public.profiles p
  WHERE p.username ILIKE '%' || search_query || '%' ESCAPE '\'
  LIMIT 20;
END;
$$;

-- Fix 2: Add length constraint on comments content
ALTER TABLE public.comments
  ADD CONSTRAINT comments_content_length CHECK (char_length(content) <= 1000);

-- Fix 3: Allow authenticated users to discover public groups
CREATE POLICY "Authenticated users can view public groups"
  ON public.groups FOR SELECT TO authenticated
  USING (is_private = false);