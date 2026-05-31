-- Trigger-only functions: revoke EXECUTE from everyone except service_role.
DO $$
DECLARE
  fn record;
  trigger_only text[] := ARRAY[
    'update_likes_count','update_views_count','handle_new_user',
    'add_owner_to_group_members','prevent_invite_manipulation',
    'prevent_xp_manipulation','update_subject_progress'
  ];
BEGIN
  FOR fn IN
    SELECT p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = ANY(trigger_only)
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%I(%s) FROM PUBLIC, anon, authenticated', fn.proname, fn.args);
  END LOOP;
END $$;