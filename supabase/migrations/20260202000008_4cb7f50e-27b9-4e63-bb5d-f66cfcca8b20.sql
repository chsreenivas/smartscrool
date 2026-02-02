-- Add subtopic to shorts table
ALTER TABLE public.shorts ADD COLUMN IF NOT EXISTS subtopic text;

-- Add bio to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio text;

-- Create follows table for creator following
CREATE TABLE IF NOT EXISTS public.follows (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id uuid NOT NULL,
  following_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

-- Enable RLS on follows
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- RLS Policies for follows
CREATE POLICY "Users can view all follows"
  ON public.follows FOR SELECT
  USING (true);

CREATE POLICY "Users can follow others"
  ON public.follows FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow"
  ON public.follows FOR DELETE
  USING (auth.uid() = follower_id);

-- Create topic_quiz_progress table for per-topic quiz tracking
CREATE TABLE IF NOT EXISTS public.topic_quiz_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  topic text NOT NULL,
  videos_watched integer NOT NULL DEFAULT 0,
  last_quiz_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, topic)
);

-- Enable RLS on topic_quiz_progress
ALTER TABLE public.topic_quiz_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies for topic_quiz_progress
CREATE POLICY "Users can view own topic progress"
  ON public.topic_quiz_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own topic progress"
  ON public.topic_quiz_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own topic progress"
  ON public.topic_quiz_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- Function to get follower count
CREATE OR REPLACE FUNCTION public.get_follower_count(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (SELECT COUNT(*)::integer FROM follows WHERE following_id = p_user_id);
END;
$$;

-- Function to get following count
CREATE OR REPLACE FUNCTION public.get_following_count(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (SELECT COUNT(*)::integer FROM follows WHERE follower_id = p_user_id);
END;
$$;

-- Function to check if user is following another
CREATE OR REPLACE FUNCTION public.is_following(p_follower_id uuid, p_following_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM follows 
    WHERE follower_id = p_follower_id AND following_id = p_following_id
  );
END;
$$;

-- Function to get user's uploaded videos count
CREATE OR REPLACE FUNCTION public.get_user_video_count(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (SELECT COUNT(*)::integer FROM shorts WHERE user_id = p_user_id AND is_approved = true);
END;
$$;

-- Function to increment topic video count and check for quiz
CREATE OR REPLACE FUNCTION public.record_topic_video_view(p_user_id uuid, p_topic text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_progress topic_quiz_progress%ROWTYPE;
  v_should_quiz boolean := false;
  v_videos_until_quiz integer;
BEGIN
  -- Upsert topic progress
  INSERT INTO topic_quiz_progress (user_id, topic, videos_watched)
  VALUES (p_user_id, p_topic, 1)
  ON CONFLICT (user_id, topic)
  DO UPDATE SET 
    videos_watched = topic_quiz_progress.videos_watched + 1,
    updated_at = now()
  RETURNING * INTO v_progress;
  
  -- Check if quiz is needed (every 25 videos)
  IF v_progress.videos_watched % 25 = 0 THEN
    v_should_quiz := true;
  END IF;
  
  v_videos_until_quiz := 25 - (v_progress.videos_watched % 25);
  
  RETURN jsonb_build_object(
    'videos_watched', v_progress.videos_watched,
    'should_show_quiz', v_should_quiz,
    'videos_until_quiz', v_videos_until_quiz
  );
END;
$$;