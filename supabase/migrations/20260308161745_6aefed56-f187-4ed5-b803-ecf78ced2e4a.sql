
-- Fix group_invites policy to actually prevent column manipulation
-- Use a trigger instead since RLS WITH CHECK can't reference OLD values
DROP POLICY IF EXISTS "Invitees can respond to invites" ON group_invites;
CREATE POLICY "Invitees can respond to invites" ON group_invites
  FOR UPDATE TO authenticated
  USING (auth.uid() = invitee_id)
  WITH CHECK (auth.uid() = invitee_id);

-- Create trigger to prevent changing anything except status
CREATE OR REPLACE FUNCTION public.prevent_invite_manipulation()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.group_id != OLD.group_id 
    OR NEW.inviter_id != OLD.inviter_id 
    OR NEW.invitee_id != OLD.invitee_id 
    OR NEW.created_at != OLD.created_at THEN
    RAISE EXCEPTION 'Only the status field can be updated on invites';
  END IF;
  IF NEW.status NOT IN ('accepted', 'declined') THEN
    RAISE EXCEPTION 'Invalid invite status';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_invite_update ON group_invites;
CREATE TRIGGER enforce_invite_update
  BEFORE UPDATE ON group_invites
  FOR EACH ROW EXECUTE FUNCTION prevent_invite_manipulation();
