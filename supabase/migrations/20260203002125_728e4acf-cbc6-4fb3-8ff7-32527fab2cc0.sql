-- Fix 1: Create a public view for profiles that only exposes non-sensitive fields
-- and update RLS to restrict direct table access

-- Create a view for friend-visible profile data (excludes sensitive fields)
CREATE OR REPLACE VIEW public.profiles_public
WITH (security_invoker = true) AS
SELECT 
  id,
  username,
  avatar_url,
  bio,
  xp,
  streak
FROM public.profiles;

-- Grant access to authenticated users
GRANT SELECT ON public.profiles_public TO authenticated;

-- Drop existing SELECT policies on profiles
DROP POLICY IF EXISTS "Users can view own and friends profiles" ON public.profiles;

-- Create new policy: Users can only view their own full profile
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Fix 2: Fix the buggy groups RLS policy
-- The current policy has 'gm.group_id = gm.id' which should be 'gm.group_id = groups.id'

-- Drop the broken policy
DROP POLICY IF EXISTS "Members can view their groups" ON public.groups;

-- Create the corrected policy for group visibility
CREATE POLICY "Members can view their groups"
ON public.groups
FOR SELECT
USING (
  -- Owner can always see their groups
  owner_id = auth.uid()
  OR
  -- Members can see groups they belong to
  EXISTS (
    SELECT 1 FROM group_members gm
    WHERE gm.group_id = groups.id 
    AND gm.user_id = auth.uid()
  )
);

-- Fix 3: Also fix the group_members visibility policy which has the same bug
DROP POLICY IF EXISTS "Members can view group membership" ON public.group_members;

CREATE POLICY "Members can view group membership"
ON public.group_members
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM group_members gm2
    WHERE gm2.group_id = group_members.group_id 
    AND gm2.user_id = auth.uid()
  )
);

-- Fix 4: Fix the group_invites INSERT policy which also has a bug
DROP POLICY IF EXISTS "Group members can send invites" ON public.group_invites;

CREATE POLICY "Group members can send invites"
ON public.group_invites
FOR INSERT
WITH CHECK (
  auth.uid() = inviter_id
  AND EXISTS (
    SELECT 1 FROM group_members gm
    WHERE gm.group_id = group_invites.group_id 
    AND gm.user_id = auth.uid()
  )
);