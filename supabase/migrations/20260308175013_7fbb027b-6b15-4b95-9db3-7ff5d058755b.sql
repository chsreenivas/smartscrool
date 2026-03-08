-- Fix infinite recursion on group_members SELECT policy
DROP POLICY IF EXISTS "Members can view group membership" ON public.group_members;

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