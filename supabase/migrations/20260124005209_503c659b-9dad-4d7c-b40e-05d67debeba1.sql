-- Add new columns to shorts table for Smart Scroll features
ALTER TABLE public.shorts 
ADD COLUMN IF NOT EXISTS difficulty_level text DEFAULT 'medium' CHECK (difficulty_level IN ('easy', 'medium', 'hard')),
ADD COLUMN IF NOT EXISTS ai_summary text,
ADD COLUMN IF NOT EXISTS topics text[] DEFAULT '{}';

-- Create user_video_progress table for tracking watch progress
CREATE TABLE IF NOT EXISTS public.user_video_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  short_id uuid NOT NULL REFERENCES public.shorts(id) ON DELETE CASCADE,
  completed boolean NOT NULL DEFAULT false,
  time_spent integer NOT NULL DEFAULT 0,
  last_position integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, short_id)
);

-- Enable RLS on user_video_progress
ALTER TABLE public.user_video_progress ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_video_progress
CREATE POLICY "Users can view own video progress"
ON public.user_video_progress FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own video progress"
ON public.user_video_progress FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own video progress"
ON public.user_video_progress FOR UPDATE
USING (auth.uid() = user_id);

-- Create daily_goals table for micro-goals
CREATE TABLE IF NOT EXISTS public.daily_goals (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  goal_type text NOT NULL CHECK (goal_type IN ('videos', 'quizzes', 'xp', 'subject')),
  subject text,
  target integer NOT NULL DEFAULT 3,
  progress integer NOT NULL DEFAULT 0,
  completed boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, date, goal_type, subject)
);

-- Enable RLS on daily_goals
ALTER TABLE public.daily_goals ENABLE ROW LEVEL SECURITY;

-- RLS policies for daily_goals
CREATE POLICY "Users can view own daily goals"
ON public.daily_goals FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily goals"
ON public.daily_goals FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily goals"
ON public.daily_goals FOR UPDATE
USING (auth.uid() = user_id);

-- Create user_subject_progress for adaptive learning
CREATE TABLE IF NOT EXISTS public.user_subject_progress (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  subject text NOT NULL,
  videos_watched integer NOT NULL DEFAULT 0,
  quizzes_attempted integer NOT NULL DEFAULT 0,
  quizzes_passed integer NOT NULL DEFAULT 0,
  total_score integer NOT NULL DEFAULT 0,
  avg_score numeric(5,2) DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, subject)
);

-- Enable RLS on user_subject_progress
ALTER TABLE public.user_subject_progress ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_subject_progress
CREATE POLICY "Users can view own subject progress"
ON public.user_subject_progress FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subject progress"
ON public.user_subject_progress FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subject progress"
ON public.user_subject_progress FOR UPDATE
USING (auth.uid() = user_id);

-- Add theme preferences to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS theme_background text DEFAULT 'default',
ADD COLUMN IF NOT EXISTS theme_animation text,
ADD COLUMN IF NOT EXISTS accessibility_settings jsonb DEFAULT '{"highContrast": false, "dyslexiaFont": false, "reducedMotion": false}'::jsonb,
ADD COLUMN IF NOT EXISTS daily_goal_target integer DEFAULT 5;

-- Create function to check if user is new (no video views)
CREATE OR REPLACE FUNCTION public.is_new_user(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM short_views WHERE user_id = p_user_id LIMIT 1
  );
END;
$$;

-- Create function to get starter feed videos (top by views)
CREATE OR REPLACE FUNCTION public.get_starter_feed(p_limit integer DEFAULT 10)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  video_url text,
  thumbnail_url text,
  category text,
  likes_count integer,
  views_count integer,
  difficulty_level text,
  ai_summary text,
  topics text[],
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.title,
    s.description,
    s.video_url,
    s.thumbnail_url,
    s.category,
    s.likes_count,
    s.views_count,
    s.difficulty_level,
    s.ai_summary,
    s.topics,
    s.created_at
  FROM shorts s
  WHERE s.is_approved = true
  ORDER BY s.views_count DESC, s.created_at DESC
  LIMIT p_limit;
END;
$$;

-- Create function to update subject progress when video is watched
CREATE OR REPLACE FUNCTION public.update_subject_progress()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_category text;
BEGIN
  -- Get the category of the watched video
  SELECT category INTO v_category FROM shorts WHERE id = NEW.short_id;
  
  -- Upsert the subject progress
  INSERT INTO user_subject_progress (user_id, subject, videos_watched)
  VALUES (NEW.user_id, v_category, 1)
  ON CONFLICT (user_id, subject)
  DO UPDATE SET 
    videos_watched = user_subject_progress.videos_watched + 1,
    updated_at = now();
  
  RETURN NEW;
END;
$$;

-- Create trigger for updating subject progress on video view
DROP TRIGGER IF EXISTS update_subject_progress_trigger ON short_views;
CREATE TRIGGER update_subject_progress_trigger
AFTER INSERT ON short_views
FOR EACH ROW
EXECUTE FUNCTION public.update_subject_progress();