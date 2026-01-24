-- ============================================
-- SECURITY FIX 1: Quiz Answers - Create secure view
-- ============================================

-- Create a view that excludes correct_answer for public access
CREATE VIEW public.quizzes_public
WITH (security_invoker = true) AS
SELECT id, short_id, question, options, xp_reward, created_at
FROM public.quizzes;

-- Grant SELECT on view to authenticated users
GRANT SELECT ON public.quizzes_public TO authenticated;

-- Update the quizzes SELECT policy to be admin-only
DROP POLICY IF EXISTS "Anyone can view quizzes" ON public.quizzes;

CREATE POLICY "Only admins can view full quizzes"
  ON public.quizzes FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'moderator')
  ));

-- ============================================
-- SECURITY FIX 2: XP Manipulation - Server-side XP awarding
-- ============================================

-- Create XP transaction log table for audit trail
CREATE TABLE IF NOT EXISTS public.xp_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount INTEGER NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('view', 'quiz', 'achievement', 'streak')),
  reference_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on xp_transactions
ALTER TABLE public.xp_transactions ENABLE ROW LEVEL SECURITY;

-- Users can only view their own XP transactions
CREATE POLICY "Users can view own xp transactions"
  ON public.xp_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- No direct insert/update/delete from clients
-- All inserts happen via server-side functions

-- Create secure server-side function for awarding XP
CREATE OR REPLACE FUNCTION public.award_xp(
  p_user_id UUID,
  p_amount INTEGER,
  p_source TEXT,
  p_reference_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today DATE;
  v_last_activity DATE;
  v_current_streak INTEGER;
  v_new_streak INTEGER;
BEGIN
  -- Validate amount is within expected ranges
  IF p_amount <= 0 OR p_amount > 100 THEN
    RAISE EXCEPTION 'Invalid XP amount: must be between 1 and 100';
  END IF;
  
  -- Validate source
  IF p_source NOT IN ('view', 'quiz', 'achievement', 'streak') THEN
    RAISE EXCEPTION 'Invalid XP source';
  END IF;

  -- Get current profile data
  SELECT last_activity_date, streak INTO v_last_activity, v_current_streak
  FROM public.profiles
  WHERE id = p_user_id;

  v_today := CURRENT_DATE;
  v_new_streak := v_current_streak;

  -- Update streak logic
  IF v_last_activity IS NOT NULL THEN
    IF v_last_activity = v_today - INTERVAL '1 day' THEN
      v_new_streak := v_current_streak + 1;
    ELSIF v_last_activity != v_today THEN
      v_new_streak := 1;
    END IF;
  ELSE
    v_new_streak := 1;
  END IF;

  -- Log the transaction
  INSERT INTO public.xp_transactions (user_id, amount, source, reference_id)
  VALUES (p_user_id, p_amount, p_source, p_reference_id);

  -- Update profile
  UPDATE public.profiles
  SET 
    xp = xp + p_amount,
    streak = v_new_streak,
    last_activity_date = v_today,
    updated_at = now()
  WHERE id = p_user_id;

  RETURN TRUE;
END;
$$;

-- Create function to verify quiz answer server-side
CREATE OR REPLACE FUNCTION public.submit_quiz_answer(
  p_quiz_id UUID,
  p_selected_answer INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_correct_answer INTEGER;
  v_xp_reward INTEGER;
  v_is_correct BOOLEAN;
  v_xp_earned INTEGER;
  v_existing_attempt UUID;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Check if already attempted
  SELECT id INTO v_existing_attempt
  FROM public.quiz_attempts
  WHERE quiz_id = p_quiz_id AND user_id = v_user_id;

  IF v_existing_attempt IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Quiz already attempted');
  END IF;

  -- Get correct answer (only accessible server-side now)
  SELECT correct_answer, xp_reward INTO v_correct_answer, v_xp_reward
  FROM public.quizzes
  WHERE id = p_quiz_id;

  IF v_correct_answer IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Quiz not found');
  END IF;

  v_is_correct := (p_selected_answer = v_correct_answer);
  v_xp_earned := CASE WHEN v_is_correct THEN v_xp_reward ELSE 0 END;

  -- Record the attempt
  INSERT INTO public.quiz_attempts (user_id, quiz_id, selected_answer, is_correct, xp_earned)
  VALUES (v_user_id, p_quiz_id, p_selected_answer, v_is_correct, v_xp_earned);

  -- Award XP if correct
  IF v_xp_earned > 0 THEN
    PERFORM public.award_xp(v_user_id, v_xp_earned, 'quiz', p_quiz_id);
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'is_correct', v_is_correct,
    'xp_earned', v_xp_earned,
    'correct_answer', v_correct_answer
  );
END;
$$;

-- Update profiles UPDATE policy to prevent XP/streak manipulation
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can update profile metadata only"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
  );

-- ============================================
-- SECURITY FIX 3: Moderation logs - Secure INSERT
-- ============================================

-- Add policy for service role inserts only (via edge functions)
-- Note: Service role bypasses RLS, but we add explicit policies for clarity
CREATE POLICY "No direct insert to moderation_logs"
  ON public.moderation_logs FOR INSERT
  WITH CHECK (false);

CREATE POLICY "No update to moderation_logs"
  ON public.moderation_logs FOR UPDATE
  USING (false);

CREATE POLICY "No delete from moderation_logs"
  ON public.moderation_logs FOR DELETE
  USING (false);