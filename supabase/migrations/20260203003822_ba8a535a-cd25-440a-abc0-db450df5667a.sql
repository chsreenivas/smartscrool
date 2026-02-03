-- Fix profiles_public view: Add RLS to restrict to authenticated users only
-- First we need to enable RLS on the view by recreating it as a table with RLS
-- Since views can't have RLS directly in PostgreSQL, we'll modify the approach

-- Drop the existing view
DROP VIEW IF EXISTS public.profiles_public;

-- Instead, create a more restrictive policy on the profiles table
-- that allows authenticated users to see basic profile info of other users
-- This is needed for social features (seeing friend usernames, avatars)

-- Drop the overly restrictive policy we created earlier
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create a policy that allows users to see their own full profile
CREATE POLICY "Users can view their own full profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Create a security definer function to safely get public profile data
-- This ensures only specific fields are exposed and requires authentication
CREATE OR REPLACE FUNCTION public.get_public_profile(p_user_id uuid)
RETURNS TABLE (
  id uuid,
  username text,
  avatar_url text,
  bio text,
  xp integer,
  streak integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow authenticated users to access public profiles
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  RETURN QUERY
  SELECT 
    p.id,
    p.username,
    p.avatar_url,
    p.bio,
    p.xp,
    p.streak
  FROM profiles p
  WHERE p.id = p_user_id;
END;
$$;

-- Create a function to get multiple public profiles (for friend lists, etc.)
CREATE OR REPLACE FUNCTION public.get_public_profiles(p_user_ids uuid[])
RETURNS TABLE (
  id uuid,
  username text,
  avatar_url text,
  bio text,
  xp integer,
  streak integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow authenticated users
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  RETURN QUERY
  SELECT 
    p.id,
    p.username,
    p.avatar_url,
    p.bio,
    p.xp,
    p.streak
  FROM profiles p
  WHERE p.id = ANY(p_user_ids);
END;
$$;

-- Fix quizzes_public view: require authentication
-- Drop the existing view
DROP VIEW IF EXISTS public.quizzes_public;

-- Create a function to safely get quiz data (requires auth)
CREATE OR REPLACE FUNCTION public.get_quiz_public(p_quiz_id uuid)
RETURNS TABLE (
  id uuid,
  short_id uuid,
  question text,
  options jsonb,
  xp_reward integer,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow authenticated users
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  RETURN QUERY
  SELECT 
    q.id,
    q.short_id,
    q.question,
    q.options,
    q.xp_reward,
    q.created_at
  FROM quizzes q
  WHERE q.id = p_quiz_id;
END;
$$;