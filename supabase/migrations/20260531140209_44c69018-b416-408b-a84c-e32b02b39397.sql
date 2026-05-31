-- EXECUTE is granted to PUBLIC by default. Revoke from PUBLIC then grant to authenticated only.
DO $$
DECLARE
  fn record;
  auth_required text[] := ARRAY[
    'submit_quiz_answer','award_xp','award_achievement',
    'get_public_profile','get_public_profiles','search_users_by_username',
    'get_quiz_public','get_quiz_for_short','record_topic_video_view',
    'check_rate_limit','get_recommended_feed','get_user_video_count',
    'get_follower_count','get_following_count','is_following','are_friends',
    'is_new_user','is_group_member','has_role','get_starter_feed'
  ];
BEGIN
  FOR fn IN
    SELECT p.oid, p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef = true
      AND p.proname = ANY(auth_required)
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%I(%s) FROM PUBLIC, anon', fn.proname, fn.args);
    EXECUTE format('GRANT EXECUTE ON FUNCTION public.%I(%s) TO authenticated, service_role', fn.proname, fn.args);
  END LOOP;
END $$;