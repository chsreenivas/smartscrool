
-- Learning paths tables
CREATE TABLE public.learning_paths (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '📚',
  step_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.learning_path_steps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  path_id UUID NOT NULL REFERENCES public.learning_paths(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  step_order INTEGER NOT NULL,
  step_type TEXT NOT NULL DEFAULT 'video',
  required_category TEXT,
  required_videos INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(path_id, step_order)
);

CREATE TABLE public.user_path_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  path_id UUID NOT NULL REFERENCES public.learning_paths(id) ON DELETE CASCADE,
  step_id UUID NOT NULL REFERENCES public.learning_path_steps(id) ON DELETE CASCADE,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, step_id)
);

-- RLS for learning_paths (public read)
ALTER TABLE public.learning_paths ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view learning paths" ON public.learning_paths FOR SELECT USING (true);

-- RLS for learning_path_steps (public read)
ALTER TABLE public.learning_path_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view learning path steps" ON public.learning_path_steps FOR SELECT USING (true);

-- RLS for user_path_progress
ALTER TABLE public.user_path_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own path progress" ON public.user_path_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own path progress" ON public.user_path_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own path progress" ON public.user_path_progress FOR UPDATE USING (auth.uid() = user_id);

-- Update get_recommended_feed to factor in user_subject_progress watch counts
CREATE OR REPLACE FUNCTION public.get_recommended_feed(p_user_id uuid, p_category text DEFAULT NULL::text, p_difficulty text DEFAULT NULL::text, p_search text DEFAULT NULL::text, p_limit integer DEFAULT 50)
 RETURNS TABLE(id uuid, user_id uuid, title text, description text, video_url text, thumbnail_url text, category text, subtopic text, likes_count integer, views_count integer, is_approved boolean, created_at timestamp with time zone, difficulty_level text, ai_summary text, topics text[], recommendation_score double precision)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  v_user_interests text[];
  v_watched_ids uuid[];
BEGIN
  SELECT p.interests INTO v_user_interests
  FROM profiles p WHERE p.id = p_user_id;

  SELECT array_agg(sv.short_id) INTO v_watched_ids
  FROM short_views sv WHERE sv.user_id = p_user_id;

  RETURN QUERY
  WITH category_prefs AS (
    SELECT usp.subject, usp.videos_watched
    FROM user_subject_progress usp
    WHERE usp.user_id = p_user_id
  ),
  scored AS (
    SELECT
      s.id, s.user_id, s.title, s.description, s.video_url, s.thumbnail_url,
      s.category, s.subtopic, s.likes_count, s.views_count, s.is_approved,
      s.created_at, s.difficulty_level, s.ai_summary, s.topics,
      (COALESCE(s.likes_count, 0) * 3.0 + COALESCE(s.views_count, 0) * 0.5)
      + GREATEST(0, 20.0 - (EXTRACT(EPOCH FROM (now() - s.created_at)) / 86400.0) * 0.67)
      + CASE WHEN v_user_interests IS NOT NULL AND s.category = ANY(v_user_interests) THEN 15.0 ELSE 0.0 END
      + CASE WHEN v_user_interests IS NOT NULL AND s.topics IS NOT NULL
          THEN (SELECT COUNT(*)::double precision * 5.0 FROM unnest(s.topics) t WHERE t = ANY(v_user_interests))
          ELSE 0.0 END
      + CASE WHEN v_watched_ids IS NOT NULL AND s.id = ANY(v_watched_ids) THEN -30.0 ELSE 0.0 END
      + CASE WHEN s.views_count > 5 AND (s.likes_count::double precision / s.views_count::double precision) > 0.3 THEN 10.0 ELSE 0.0 END
      -- NEW: Boost by category watch history (log scale to prevent domination)
      + COALESCE((SELECT ln(cp.videos_watched + 1) * 8.0 FROM category_prefs cp WHERE cp.subject = s.category), 0.0)
      + (random() * 16.0 - 8.0)
      AS score
    FROM shorts s
    WHERE s.is_approved = true
      AND (p_category IS NULL OR p_category = 'All' OR s.category = p_category)
      AND (p_difficulty IS NULL OR s.difficulty_level = p_difficulty)
      AND (p_search IS NULL OR s.title ILIKE '%' || p_search || '%' OR s.description ILIKE '%' || p_search || '%')
  )
  SELECT scored.id, scored.user_id, scored.title, scored.description,
    scored.video_url, scored.thumbnail_url, scored.category, scored.subtopic,
    scored.likes_count, scored.views_count, scored.is_approved,
    scored.created_at, scored.difficulty_level, scored.ai_summary,
    scored.topics, scored.score AS recommendation_score
  FROM scored
  ORDER BY scored.score DESC
  LIMIT p_limit;
END;
$$;
