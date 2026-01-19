import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  xp_reward: number;
  requirement_type: string;
  requirement_value: number;
  earned_at?: string;
}

export const useAchievements = () => {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAchievements = useCallback(async () => {
    const { data: allAchievements } = await (supabase as any)
      .from('achievements')
      .select('*')
      .order('requirement_value', { ascending: true });

    if (allAchievements) {
      setAchievements(allAchievements);
    }

    if (user) {
      const { data: earned } = await (supabase as any)
        .from('user_achievements')
        .select('*, achievements(*)')
        .eq('user_id', user.id);

      if (earned) {
        setUserAchievements(
          earned.map((e: any) => ({
            ...e.achievements,
            earned_at: e.earned_at
          }))
        );
      }
    }

    setLoading(false);
  }, [user]);

  const checkAndAwardAchievements = useCallback(async (stats: {
    xp?: number;
    streak?: number;
    quizzes?: number;
    videosWatched?: number;
    videosCreated?: number;
  }) => {
    if (!user) return;

    const { data: unearned } = await (supabase as any)
      .from('achievements')
      .select('*');

    if (!unearned) return;

    const { data: alreadyEarned } = await (supabase as any)
      .from('user_achievements')
      .select('achievement_id')
      .eq('user_id', user.id);

    const earnedIds = new Set(alreadyEarned?.map((e: any) => e.achievement_id) || []);

    for (const achievement of unearned) {
      if (earnedIds.has(achievement.id)) continue;

      let meetsRequirement = false;
      
      switch (achievement.requirement_type) {
        case 'xp':
          meetsRequirement = (stats.xp || 0) >= achievement.requirement_value;
          break;
        case 'streak':
          meetsRequirement = (stats.streak || 0) >= achievement.requirement_value;
          break;
        case 'quizzes':
          meetsRequirement = (stats.quizzes || 0) >= achievement.requirement_value;
          break;
        case 'videos_watched':
          meetsRequirement = (stats.videosWatched || 0) >= achievement.requirement_value;
          break;
        case 'videos_created':
          meetsRequirement = (stats.videosCreated || 0) >= achievement.requirement_value;
          break;
      }

      if (meetsRequirement) {
        const { error } = await (supabase as any)
          .from('user_achievements')
          .insert({ user_id: user.id, achievement_id: achievement.id });

        if (!error) {
          toast.success(
            `🏆 Achievement Unlocked: ${achievement.name}! +${achievement.xp_reward} XP`,
            { duration: 5000 }
          );
          
          // Add XP reward
          await supabase
            .from('profiles')
            .update({ xp: stats.xp! + achievement.xp_reward })
            .eq('id', user.id);
        }
      }
    }

    fetchAchievements();
  }, [user, fetchAchievements]);

  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);

  return {
    achievements,
    userAchievements,
    loading,
    checkAndAwardAchievements,
    refetch: fetchAchievements
  };
};
