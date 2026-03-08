
CREATE OR REPLACE FUNCTION public.get_recommended_feed(
  p_user_id uuid,
  p_category text DEFAULT NULL,
  p_difficulty text DEFAULT NULL,
  p_search text DEFAULT NULL,
  p_limit integer DEFAULT 50
)
RETURNS TABLE(
  id uuid,
  user_id uuid,
  title text,
  description text,
  video_url text,
  thumbnail_url text,
  category text,
  subtopic text,
  likes_count integer,
  views_count integer,
  is_approved boolean,
  created_at timestamp with time zone,
  difficulty_level text,
  ai_summary text,
  topics text[],
  recommendation_score double precision
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_interests text[];
  v_watched_ids uuid[];
BEGIN
  -- Get user interests for category matching
  SELECT p.interests INTO v_user_interests
  FROM profiles p WHERE p.id = p_user_id;

  -- Get already-watched video IDs to deprioritize (not exclude)
  SELECT array_agg(sv.short_id) INTO v_watched_ids
  FROM short_views sv WHERE sv.user_id = p_user_id;

  RETURN QUERY
  WITH scored AS (
    SELECT
      s.id,
      s.user_id,
      s.title,
      s.description,
      s.video_url,
      s.thumbnail_url,
      s.category,
      s.subtopic,
      s.likes_count,
      s.views_count,
      s.is_approved,
      s.created_at,
      s.difficulty_level,
      s.ai_summary,
      s.topics,
      -- Engagement score (normalized)
      (COALESCE(s.likes_count, 0) * 3.0 + COALESCE(s.views_count, 0) * 0.5)
      -- Recency boost: videos from last 7 days get up to +20, decays over 30 days
      + GREATEST(0, 20.0 - (EXTRACT(EPOCH FROM (now() - s.created_at)) / 86400.0) * 0.67)
      -- Category match: +15 if matches user interests
      + CASE WHEN v_user_interests IS NOT NULL AND s.category = ANY(v_user_interests) THEN 15.0 ELSE 0.0 END
      -- Topic overlap with interests: +5 per matching topic
      + CASE WHEN v_user_interests IS NOT NULL AND s.topics IS NOT NULL
          THEN (SELECT COUNT(*)::double precision * 5.0 FROM unnest(s.topics) t WHERE t = ANY(v_user_interests))
          ELSE 0.0 END
      -- Deprioritize already watched (don't exclude, just lower score)
      + CASE WHEN v_watched_ids IS NOT NULL AND s.id = ANY(v_watched_ids) THEN -30.0 ELSE 0.0 END
      -- Trending boost: high likes relative to views
      + CASE WHEN s.views_count > 5 AND (s.likes_count::double precision / s.views_count::double precision) > 0.3 THEN 10.0 ELSE 0.0 END
      -- Random factor for discovery (±8 points)
      + (random() * 16.0 - 8.0)
      AS score
    FROM shorts s
    WHERE s.is_approved = true
      AND (p_category IS NULL OR p_category = 'All' OR s.category = p_category)
      AND (p_difficulty IS NULL OR s.difficulty_level = p_difficulty)
      AND (p_search IS NULL OR s.title ILIKE '%' || p_search || '%' OR s.description ILIKE '%' || p_search || '%')
  )
  SELECT
    scored.id, scored.user_id, scored.title, scored.description,
    scored.video_url, scored.thumbnail_url, scored.category, scored.subtopic,
    scored.likes_count, scored.views_count, scored.is_approved,
    scored.created_at, scored.difficulty_level, scored.ai_summary,
    scored.topics, scored.score AS recommendation_score
  FROM scored
  ORDER BY scored.score DESC
  LIMIT p_limit;
END;
$$;
