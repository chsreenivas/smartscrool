-- Create rate_limits table for tracking per-user API usage
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  endpoint text NOT NULL,
  request_count int NOT NULL DEFAULT 1,
  window_start timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

-- Enable RLS
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- No direct access - rate limits are managed by edge functions with service role
CREATE POLICY "No direct user access to rate_limits"
  ON public.rate_limits FOR ALL
  USING (false);

-- Create index for fast lookups
CREATE INDEX idx_rate_limits_user_endpoint ON public.rate_limits(user_id, endpoint);
CREATE INDEX idx_rate_limits_window ON public.rate_limits(window_start);

-- Create function to check and update rate limit
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_user_id uuid,
  p_endpoint text,
  p_max_requests int,
  p_window_seconds int
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_window_start timestamptz;
  v_current_count int;
  v_result boolean;
BEGIN
  -- Calculate window start time
  v_window_start := now() - (p_window_seconds || ' seconds')::interval;
  
  -- Try to get existing rate limit record
  SELECT request_count, window_start INTO v_current_count, v_window_start
  FROM rate_limits
  WHERE user_id = p_user_id AND endpoint = p_endpoint;
  
  IF NOT FOUND THEN
    -- First request - create new record
    INSERT INTO rate_limits (user_id, endpoint, request_count, window_start)
    VALUES (p_user_id, p_endpoint, 1, now());
    RETURN true;
  END IF;
  
  -- Check if window has expired
  IF v_window_start < now() - (p_window_seconds || ' seconds')::interval THEN
    -- Reset window
    UPDATE rate_limits
    SET request_count = 1, window_start = now()
    WHERE user_id = p_user_id AND endpoint = p_endpoint;
    RETURN true;
  END IF;
  
  -- Check if under limit
  IF v_current_count < p_max_requests THEN
    -- Increment counter
    UPDATE rate_limits
    SET request_count = request_count + 1
    WHERE user_id = p_user_id AND endpoint = p_endpoint;
    RETURN true;
  END IF;
  
  -- Rate limit exceeded
  RETURN false;
END;
$$;