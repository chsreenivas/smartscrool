
-- 1. FIX: Shorts self-approval bypass
-- Restrict INSERT so users cannot set is_approved=true or moderation_status to approved
DROP POLICY IF EXISTS "Users can insert own shorts" ON shorts;
CREATE POLICY "Users can insert own shorts" ON shorts
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND is_approved = false
    AND (moderation_status IS NULL OR moderation_status = 'pending')
  );

-- Restrict UPDATE so users cannot self-approve
DROP POLICY IF EXISTS "Users can update own shorts" ON shorts;
CREATE POLICY "Users can update own shorts" ON shorts
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND is_approved = false
    AND (moderation_status IS NULL OR moderation_status = 'pending')
  );

-- 2. FIX: Group invites manipulation - restrict UPDATE to status column only
DROP POLICY IF EXISTS "Invitees can respond to invites" ON group_invites;
CREATE POLICY "Invitees can respond to invites" ON group_invites
  FOR UPDATE TO authenticated
  USING (auth.uid() = invitee_id)
  WITH CHECK (
    auth.uid() = invitee_id
    AND group_id = group_id
    AND inviter_id = inviter_id
    AND invitee_id = invitee_id
  );

-- 3. FIX: Quiz attempts direct insert bypass
-- Block direct INSERT; only submit_quiz_answer RPC (SECURITY DEFINER) should insert
DROP POLICY IF EXISTS "Users can submit attempts" ON quiz_attempts;
CREATE POLICY "No direct insert to quiz_attempts" ON quiz_attempts
  FOR INSERT TO authenticated
  WITH CHECK (false);
