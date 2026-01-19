-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Service can update moderation status" ON public.shorts;

-- The service role bypasses RLS automatically, so no additional policy is needed
-- Existing policies already allow users to update their own shorts