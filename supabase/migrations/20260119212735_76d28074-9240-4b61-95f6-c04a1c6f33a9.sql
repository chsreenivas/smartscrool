-- ============================================
-- BRAINSCROLL COMPLETE DATABASE SCHEMA
-- Educational TikTok-style app for teens
-- ============================================

-- 1. USER ROLES TABLE (for admin/moderator access)
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'moderator', 'creator')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Admins can view all roles
CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

-- Users can view their own roles
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- 2. FRIENDSHIPS TABLE (for private social)
CREATE TABLE public.friendships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID NOT NULL,
  addressee_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'blocked')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(requester_id, addressee_id)
);

ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their friendships"
  ON public.friendships FOR SELECT
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

CREATE POLICY "Users can send friend requests"
  ON public.friendships FOR INSERT
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update friendships they're part of"
  ON public.friendships FOR UPDATE
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

CREATE POLICY "Users can delete their friendships"
  ON public.friendships FOR DELETE
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- 3. GROUPS TABLE (for private group sharing)
CREATE TABLE public.groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL,
  avatar_url TEXT,
  is_private BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

-- 4. GROUP MEMBERS TABLE
CREATE TABLE public.group_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- Group RLS policies
CREATE POLICY "Members can view their groups"
  ON public.groups FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members gm 
      WHERE gm.group_id = id AND gm.user_id = auth.uid()
    ) OR owner_id = auth.uid()
  );

CREATE POLICY "Users can create groups"
  ON public.groups FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update groups"
  ON public.groups FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete groups"
  ON public.groups FOR DELETE
  USING (auth.uid() = owner_id);

-- Group members RLS
CREATE POLICY "Members can view group membership"
  ON public.group_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members gm2 
      WHERE gm2.group_id = group_id AND gm2.user_id = auth.uid()
    )
  );

CREATE POLICY "Group owners can manage members"
  ON public.group_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.groups g 
      WHERE g.id = group_id AND g.owner_id = auth.uid()
    ) OR auth.uid() = user_id
  );

CREATE POLICY "Group owners can update members"
  ON public.group_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.groups g 
      WHERE g.id = group_id AND g.owner_id = auth.uid()
    )
  );

CREATE POLICY "Members can leave groups"
  ON public.group_members FOR DELETE
  USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM public.groups g 
      WHERE g.id = group_id AND g.owner_id = auth.uid()
    )
  );

-- 5. GROUP INVITES TABLE
CREATE TABLE public.group_invites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL,
  invitee_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(group_id, invitee_id)
);

ALTER TABLE public.group_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their invites"
  ON public.group_invites FOR SELECT
  USING (auth.uid() = inviter_id OR auth.uid() = invitee_id);

CREATE POLICY "Group members can send invites"
  ON public.group_invites FOR INSERT
  WITH CHECK (
    auth.uid() = inviter_id AND
    EXISTS (
      SELECT 1 FROM public.group_members gm 
      WHERE gm.group_id = group_id AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Invitees can respond to invites"
  ON public.group_invites FOR UPDATE
  USING (auth.uid() = invitee_id);

CREATE POLICY "Inviters can delete invites"
  ON public.group_invites FOR DELETE
  USING (auth.uid() = inviter_id);

-- 6. MESSAGES TABLE (private messaging)
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their messages"
  ON public.messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages to friends"
  ON public.messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.friendships f
      WHERE f.status = 'accepted' AND
      ((f.requester_id = auth.uid() AND f.addressee_id = receiver_id) OR
       (f.addressee_id = auth.uid() AND f.requester_id = receiver_id))
    )
  );

CREATE POLICY "Users can update messages they received"
  ON public.messages FOR UPDATE
  USING (auth.uid() = receiver_id);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- 7. REPOSTS TABLE (private sharing)
CREATE TABLE public.reposts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  short_id UUID NOT NULL,
  sender_id UUID NOT NULL,
  recipient_id UUID,
  group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CHECK (recipient_id IS NOT NULL OR group_id IS NOT NULL)
);

ALTER TABLE public.reposts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view reposts sent to them or their groups"
  ON public.reposts FOR SELECT
  USING (
    auth.uid() = sender_id OR
    auth.uid() = recipient_id OR
    EXISTS (
      SELECT 1 FROM public.group_members gm 
      WHERE gm.group_id = reposts.group_id AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can send reposts"
  ON public.reposts FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can delete their reposts"
  ON public.reposts FOR DELETE
  USING (auth.uid() = sender_id);

-- 8. QUIZZES TABLE (auto-generated per video)
CREATE TABLE public.quizzes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  short_id UUID NOT NULL,
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_answer INTEGER NOT NULL,
  xp_reward INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view quizzes"
  ON public.quizzes FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage quizzes"
  ON public.quizzes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'moderator')
    )
  );

-- 9. QUIZ ATTEMPTS TABLE (track user answers)
CREATE TABLE public.quiz_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  selected_answer INTEGER NOT NULL,
  is_correct BOOLEAN NOT NULL,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(quiz_id, user_id)
);

ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own attempts"
  ON public.quiz_attempts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can submit attempts"
  ON public.quiz_attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 10. CONTENT REPORTS TABLE (for moderation)
CREATE TABLE public.content_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  short_id UUID NOT NULL,
  reporter_id UUID NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('non_educational', 'inappropriate', 'spam', 'copyright', 'other')),
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'actioned', 'dismissed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID
);

ALTER TABLE public.content_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can submit reports"
  ON public.content_reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Reporters can view own reports"
  ON public.content_reports FOR SELECT
  USING (auth.uid() = reporter_id);

CREATE POLICY "Admins can view all reports"
  ON public.content_reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'moderator')
    )
  );

CREATE POLICY "Admins can update reports"
  ON public.content_reports FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() AND ur.role IN ('admin', 'moderator')
    )
  );

-- 11. ACHIEVEMENTS TABLE (gamification)
CREATE TABLE public.achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  xp_reward INTEGER NOT NULL DEFAULT 0,
  requirement_type TEXT NOT NULL CHECK (requirement_type IN ('xp', 'streak', 'quizzes', 'videos_watched', 'videos_created')),
  requirement_value INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view achievements"
  ON public.achievements FOR SELECT
  USING (true);

-- 12. USER ACHIEVEMENTS TABLE
CREATE TABLE public.user_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own achievements"
  ON public.user_achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can award achievements"
  ON public.user_achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 13. Helper functions
CREATE OR REPLACE FUNCTION public.search_users_by_username(search_query TEXT)
RETURNS TABLE(id UUID, username TEXT, avatar_url TEXT)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.username, p.avatar_url
  FROM public.profiles p
  WHERE p.username ILIKE '%' || search_query || '%'
  LIMIT 20;
END;
$$;

CREATE OR REPLACE FUNCTION public.are_friends(user_id_1 UUID, user_id_2 UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.friendships f
    WHERE f.status = 'accepted' AND
    ((f.requester_id = user_id_1 AND f.addressee_id = user_id_2) OR
     (f.addressee_id = user_id_1 AND f.requester_id = user_id_2))
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = _user_id AND ur.role = _role
  );
END;
$$;

-- Insert default achievements
INSERT INTO public.achievements (name, description, icon, xp_reward, requirement_type, requirement_value) VALUES
('First Steps', 'Earn your first 100 XP', '🌟', 50, 'xp', 100),
('Knowledge Seeker', 'Earn 1000 XP', '📚', 100, 'xp', 1000),
('Brain Champion', 'Earn 10000 XP', '🧠', 500, 'xp', 10000),
('Streak Starter', 'Maintain a 3-day streak', '🔥', 30, 'streak', 3),
('Week Warrior', 'Maintain a 7-day streak', '⚡', 100, 'streak', 7),
('Month Master', 'Maintain a 30-day streak', '👑', 500, 'streak', 30),
('Quiz Novice', 'Complete 5 quizzes', '❓', 50, 'quizzes', 5),
('Quiz Expert', 'Complete 50 quizzes', '🎯', 200, 'quizzes', 50),
('Curious Mind', 'Watch 10 videos', '👀', 30, 'videos_watched', 10),
('Video Scholar', 'Watch 100 videos', '🎬', 200, 'videos_watched', 100),
('Content Creator', 'Upload your first video', '🎥', 100, 'videos_created', 1);

-- Create trigger to auto-add owner to group members
CREATE OR REPLACE FUNCTION public.add_owner_to_group_members()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.group_members (group_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'owner');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_group_created
  AFTER INSERT ON public.groups
  FOR EACH ROW
  EXECUTE FUNCTION public.add_owner_to_group_members();