CREATE TABLE public.ai_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  short_id uuid NOT NULL REFERENCES public.shorts(id) ON DELETE CASCADE,
  summary text NOT NULL,
  key_points jsonb NOT NULL DEFAULT '[]'::jsonb,
  related_topics jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(short_id)
);

ALTER TABLE public.ai_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view summaries for approved shorts"
ON public.ai_summaries
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.shorts s
    WHERE s.id = ai_summaries.short_id AND s.is_approved = true
  )
);

CREATE POLICY "No direct insert to ai_summaries"
ON public.ai_summaries FOR INSERT TO authenticated
WITH CHECK (false);

CREATE POLICY "No direct update to ai_summaries"
ON public.ai_summaries FOR UPDATE TO authenticated
USING (false);

CREATE POLICY "No direct delete from ai_summaries"
ON public.ai_summaries FOR DELETE TO authenticated
USING (false);

DO $$ BEGIN
  ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS explanation text;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;