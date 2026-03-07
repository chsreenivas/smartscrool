import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Users, Video } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface CreatorHoverCardProps {
  userId: string;
  children: React.ReactNode;
}

interface CreatorInfo {
  username: string;
  avatar_url: string | null;
  bio: string | null;
  followerCount: number;
  videoCount: number;
}

export const CreatorHoverCard = ({ userId, children }: CreatorHoverCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [info, setInfo] = useState<CreatorInfo | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!isHovered || loaded) return;

    const load = async () => {
      const [profileRes, followerRes, videoRes] = await Promise.all([
        supabase.rpc('get_public_profile', { p_user_id: userId }),
        supabase.rpc('get_follower_count', { p_user_id: userId }),
        supabase.rpc('get_user_video_count', { p_user_id: userId }),
      ]);

      const profile = profileRes.data?.[0];
      if (profile) {
        setInfo({
          username: profile.username || 'Creator',
          avatar_url: profile.avatar_url,
          bio: profile.bio,
          followerCount: followerRes.data || 0,
          videoCount: videoRes.data || 0,
        });
      }
      setLoaded(true);
    };

    load();
  }, [isHovered, loaded, userId]);

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
      <AnimatePresence>
        {isHovered && info && (
          <motion.div
            className="absolute bottom-full right-0 mb-2 w-56 p-4 rounded-xl bg-card border border-border shadow-elevated z-50 pointer-events-none"
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center flex-shrink-0">
                {info.avatar_url ? (
                  <img src={info.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <User className="w-5 h-5 text-primary-foreground" />
                )}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm text-foreground truncate">{info.username}</p>
              </div>
            </div>
            {info.bio && (
              <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{info.bio}</p>
            )}
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" /> {info.followerCount}
              </span>
              <span className="flex items-center gap-1">
                <Video className="w-3 h-3" /> {info.videoCount}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
