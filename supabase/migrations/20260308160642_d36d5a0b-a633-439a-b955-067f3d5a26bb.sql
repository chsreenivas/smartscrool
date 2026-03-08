
-- 1. Create server-side award_achievement function
CREATE OR REPLACE FUNCTION public.award_achievement(p_achievement_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_achievement achievements%ROWTYPE;
  v_profile profiles%ROWTYPE;
  v_already_earned boolean;
  v_stat_value integer;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT * INTO v_achievement FROM achievements WHERE id = p_achievement_id;
  IF v_achievement.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Achievement not found');
  END IF;

  -- Check if already earned
  SELECT EXISTS(SELECT 1 FROM user_achievements WHERE user_id = v_user_id AND achievement_id = p_achievement_id) INTO v_already_earned;
  IF v_already_earned THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already earned');
  END IF;

  SELECT * INTO v_profile FROM profiles WHERE id = v_user_id;

  -- Validate requirement server-side
  CASE v_achievement.requirement_type
    WHEN 'xp' THEN v_stat_value := v_profile.xp;
    WHEN 'streak' THEN v_stat_value := v_profile.streak;
    WHEN 'quizzes' THEN
      SELECT COUNT(*)::integer INTO v_stat_value FROM quiz_attempts WHERE user_id = v_user_id AND is_correct = true;
    WHEN 'videos_watched' THEN
      SELECT COUNT(*)::integer INTO v_stat_value FROM short_views WHERE user_id = v_user_id;
    WHEN 'videos_created' THEN
      SELECT COUNT(*)::integer INTO v_stat_value FROM shorts WHERE user_id = v_user_id AND is_approved = true;
    ELSE
      RETURN jsonb_build_object('success', false, 'error', 'Unknown requirement type');
  END CASE;

  IF v_stat_value < v_achievement.requirement_value THEN
    RETURN jsonb_build_object('success', false, 'error', 'Requirements not met');
  END IF;

  INSERT INTO user_achievements(user_id, achievement_id) VALUES (v_user_id, p_achievement_id);

  -- Award XP internally
  IF v_achievement.xp_reward > 0 THEN
    INSERT INTO xp_transactions (user_id, amount, source, reference_id)
    VALUES (v_user_id, v_achievement.xp_reward, 'achievement', p_achievement_id);

    UPDATE profiles SET xp = xp + v_achievement.xp_reward, updated_at = now() WHERE id = v_user_id;
  END IF;

  RETURN jsonb_build_object('success', true, 'xp_reward', v_achievement.xp_reward);
END;
$$;

-- 2. Remove permissive INSERT on user_achievements; replace with function-only
DROP POLICY IF EXISTS "System can award achievements" ON user_achievements;
CREATE POLICY "No direct insert to user_achievements" ON user_achievements
  FOR INSERT TO authenticated WITH CHECK (false);

-- 3. Revoke public execute on award_xp to prevent direct client calls
REVOKE EXECUTE ON FUNCTION public.award_xp(uuid, integer, text, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.award_xp(uuid, integer, text, uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.award_xp(uuid, integer, text, uuid) FROM anon;

-- 4. Fix group_members INSERT policy: require invite or ownership
DROP POLICY IF EXISTS "Group owners can manage members" ON group_members;
CREATE POLICY "Group owners or invited users can join" ON group_members
  FOR INSERT TO authenticated
  WITH CHECK (
    (EXISTS (SELECT 1 FROM groups g WHERE g.id = group_members.group_id AND g.owner_id = auth.uid()))
    OR
    (auth.uid() = user_id AND EXISTS (
      SELECT 1 FROM group_invites gi
      WHERE gi.group_id = group_members.group_id
        AND gi.invitee_id = auth.uid()
        AND gi.status = 'accepted'
    ))
  );

-- 5. Fix likes SELECT policy: restrict to authenticated users
DROP POLICY IF EXISTS "Users can view all likes" ON likes;
CREATE POLICY "Authenticated users can view likes" ON likes
  FOR SELECT TO authenticated USING (true);
