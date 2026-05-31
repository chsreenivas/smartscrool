DROP POLICY IF EXISTS "Users can insert own comments" ON public.comments;

CREATE POLICY "Users can insert own comments"
ON public.comments
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.shorts s
    WHERE s.id = comments.short_id AND s.is_approved = true
  )
);