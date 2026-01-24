import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface StarterShort {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  category: string;
  likes_count: number;
  views_count: number;
  difficulty_level: string;
  ai_summary: string | null;
  topics: string[];
  created_at: string;
}

export const useStarterFeed = () => {
  const { user } = useAuth();
  const [isNewUser, setIsNewUser] = useState<boolean | null>(null);
  const [starterShorts, setStarterShorts] = useState<StarterShort[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAndLoadStarter = async () => {
      if (!user) {
        setIsNewUser(null);
        setLoading(false);
        return;
      }

      setLoading(true);

      // Check if user is new (no video views)
      const { data: isNew, error: checkError } = await supabase
        .rpc('is_new_user', { p_user_id: user.id });

      if (checkError) {
        console.error('Error checking new user status:', checkError);
        setIsNewUser(false);
        setLoading(false);
        return;
      }

      setIsNewUser(isNew);

      // If new user, load starter feed
      if (isNew) {
        const { data: starterData, error: starterError } = await supabase
          .rpc('get_starter_feed', { p_limit: 10 });

        if (starterError) {
          console.error('Error loading starter feed:', starterError);
        } else {
          setStarterShorts((starterData || []) as StarterShort[]);
        }
      }

      setLoading(false);
    };

    checkAndLoadStarter();
  }, [user]);

  const markAsNotNew = () => {
    setIsNewUser(false);
  };

  return { isNewUser, starterShorts, loading, markAsNotNew };
};
