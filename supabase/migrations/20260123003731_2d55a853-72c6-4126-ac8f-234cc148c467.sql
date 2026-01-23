-- Fix SQL injection vulnerability in search_users_by_username function
CREATE OR REPLACE FUNCTION public.search_users_by_username(search_query TEXT)
RETURNS TABLE(id UUID, username TEXT, avatar_url TEXT)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Escape ILIKE special characters to prevent SQL injection
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