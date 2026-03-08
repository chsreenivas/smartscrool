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
    const { data: allAchievements } = await supabase
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

  const checkAndAwardAchievements = useCallback(async () => {
    if (!user) return;

    const { data: allAchievements } = await supabase
      .from('achievements')
      .select('*');

    if (!allAchievements) return;

    const { data: alreadyEarned } = await (supabase as any)
      .from('user_achievements')
      .select('achievement_id')
      .eq('user_id', user.id);

    const earnedIds = new Set(alreadyEarned?.map((e: any) => e.achievement_id) || []);

    for (const achievement of allAchievements) {
      if (earnedIds.has(achievement.id)) continue;

      const { data } = await supabase.rpc('award_achievement', {
        p_achievement_id: achievement.id
      });

      const result = data as any;
      if (result?.success) {
        toast.success(
          `🏆 Achievement Unlocked: ${achievement.name}! +${result.xp_reward} XP`,
          { duration: 5000 }
        );
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
