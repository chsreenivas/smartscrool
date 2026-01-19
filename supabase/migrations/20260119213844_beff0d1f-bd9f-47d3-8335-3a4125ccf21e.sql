-- Add moderation fields to shorts table
ALTER TABLE public.shorts 
ADD COLUMN IF NOT EXISTS is_educational boolean DEFAULT NULL,
ADD COLUMN IF NOT EXISTS moderation_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS moderation_result text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS moderated_at timestamp with time zone DEFAULT NULL,
ADD COLUMN IF NOT EXISTS transcript text DEFAULT NULL;

-- Create index for moderation status queries
CREATE INDEX IF NOT EXISTS idx_shorts_moderation_status ON public.shorts(moderation_status);

-- Create moderation_logs table for audit trail (privacy: only admins can see)
CREATE TABLE IF NOT EXISTS public.moderation_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  short_id uuid NOT NULL REFERENCES public.shorts(id) ON DELETE CASCADE,
  classification text NOT NULL,
  confidence text DEFAULT NULL,
  raw_response text DEFAULT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on moderation_logs
ALTER TABLE public.moderation_logs ENABLE ROW LEVEL SECURITY;

-- Only admins/moderators can view moderation logs
CREATE POLICY "Admins can view moderation logs"
ON public.moderation_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('admin', 'moderator')
  )
);

-- Service role can insert logs (edge function uses service role)
-- No INSERT policy needed since edge function uses service role key

-- Add policy to allow admins to view pending shorts
CREATE POLICY "Admins can view pending shorts"
ON public.shorts
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('admin', 'moderator')
  )
);

-- Add policy to allow service to update shorts moderation
CREATE POLICY "Service can update moderation status"
ON public.shorts
FOR UPDATE
USING (true)
WITH CHECK (true);