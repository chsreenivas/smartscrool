-- Fix infinite recursion in user_roles RLS policy

-- Drop the problematic policy that causes recursion
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;

-- Create a simpler policy that doesn't query user_roles recursively
-- Option: Use has_role function which uses SECURITY DEFINER
-- But first, let's just allow users to see their own roles (they already can)
-- For admin functionality, we use the has_role function which bypasses RLS

-- Also drop and recreate shorts policies that reference user_roles to avoid recursion
DROP POLICY IF EXISTS "Admins can view pending shorts" ON public.shorts;
DROP POLICY IF EXISTS "Admins can update any shorts" ON public.shorts;
DROP POLICY IF EXISTS "Admins can delete any shorts" ON public.shorts;

-- Recreate admin policies using the SECURITY DEFINER function has_role()
CREATE POLICY "Admins can view pending shorts"
ON public.shorts
FOR SELECT
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

CREATE POLICY "Admins can update any shorts"
ON public.shorts
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

CREATE POLICY "Admins can delete any shorts"
ON public.shorts
FOR DELETE
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));