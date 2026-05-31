-- 1. Drop broad SELECT policies on public buckets to prevent listing.
-- Files remain accessible via the public CDN URL (which does not consult RLS).
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Banner images are publicly accessible" ON storage.objects;

-- 2. Revoke EXECUTE from anon on auth-required SECURITY DEFINER RPCs.
REVOKE EXECUTE ON FUNCTION public.submit_quiz_answer(uuid, integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.award_xp(uuid, integer, text, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.award_achievement(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_public_profile(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_public_profiles(uuid[]) FROM anon;
REVOKE EXECUTE ON FUNCTION public.search_users_by_username(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_quiz_public(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_quiz_for_short(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.record_topic_video_view(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.check_rate_limit(uuid, text, integer, integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_recommended_feed(uuid, text, text, text, integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_user_video_count(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_follower_count(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_following_count(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_following(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.are_friends(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_new_user(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_group_member(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_starter_feed(integer) FROM anon;