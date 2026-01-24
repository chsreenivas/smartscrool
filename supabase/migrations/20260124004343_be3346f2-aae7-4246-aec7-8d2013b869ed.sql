-- Create helper function to get quiz without correct_answer
CREATE OR REPLACE FUNCTION public.get_quiz_for_short(p_short_id UUID)
RETURNS TABLE (
  id UUID,
  short_id UUID,
  question TEXT,
  options JSONB,
  xp_reward INTEGER,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT q.id, q.short_id, q.question, q.options, q.xp_reward, q.created_at
  FROM public.quizzes q
  WHERE q.short_id = p_short_id
  LIMIT 1;
END;
$$;