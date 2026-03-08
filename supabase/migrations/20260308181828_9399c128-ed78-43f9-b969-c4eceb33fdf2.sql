
-- Create a security definer function to check group membership without RLS recursion
CREATE OR REPLACE FUNCTION public.is_group_member(p_group_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = p_group_id AND user_id = p_user_id
  )
$$;

-- Drop ALL existing SELECT policies on group_members to prevent conflicts
DROP POLICY IF EXISTS "Members can view group membership" ON public.group_members;
DROP POLICY IF EXISTS "Group members can view membership" ON public.group_members;

-- Recreate a simple non-recursive SELECT policy
CREATE POLICY "Members can view group membership"
ON public.group_members
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.groups g
    WHERE g.id = group_members.group_id
    AND g.owner_id = auth.uid()
  )
);

-- Fix reposts SELECT policy to avoid group_members recursion
DROP POLICY IF EXISTS "Users can view reposts sent to them or their groups" ON public.reposts;

CREATE POLICY "Users can view reposts sent to them or their groups"
ON public.reposts
FOR SELECT
TO authenticated
USING (
  auth.uid() = sender_id
  OR auth.uid() = recipient_id
  OR public.is_group_member(group_id, auth.uid())
);

-- Fix groups SELECT policy to avoid group_members recursion  
DROP POLICY IF EXISTS "Members can view their groups" ON public.groups;

CREATE POLICY "Members can view their groups"
ON public.groups
FOR SELECT
TO authenticated
USING (
  owner_id = auth.uid()
  OR public.is_group_member(id, auth.uid())
);

-- Fix group_invites INSERT policy to avoid group_members recursion
DROP POLICY IF EXISTS "Group members can send invites" ON public.group_invites;

CREATE POLICY "Group members can send invites"
ON public.group_invites
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = inviter_id
  AND public.is_group_member(group_id, auth.uid())
);
