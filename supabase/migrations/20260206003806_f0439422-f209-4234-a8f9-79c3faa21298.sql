-- Fix: Social Network Graph Fully Exposed (follows_public_select)
-- Drop the overly permissive policy that exposes the entire social graph
DROP POLICY IF EXISTS "Users can view all follows" ON public.follows;

-- Create a restrictive policy: users can only see follows where they are involved
-- or follows of their accepted friends (for privacy-respecting social features)
CREATE POLICY "Users can view relevant follows"
  ON public.follows FOR SELECT
  USING (
    auth.uid() = follower_id OR 
    auth.uid() = following_id OR
    -- Allow friends to see each other's follows for social features
    EXISTS (
      SELECT 1 FROM friendships f
      WHERE f.status = 'accepted' AND
      ((f.requester_id = auth.uid() AND (f.addressee_id = follower_id OR f.addressee_id = following_id)) OR
       (f.addressee_id = auth.uid() AND (f.requester_id = follower_id OR f.requester_id = following_id)))
    )
  );