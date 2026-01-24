import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface DailyGoal {
  id: string;
  user_id: string;
  date: string;
  goal_type: 'videos' | 'quizzes' | 'xp' | 'subject';
  subject: string | null;
  target: number;
  progress: number;
  completed: boolean;
  created_at: string;
}

export const useDailyGoals = () => {
  const { user } = useAuth();
  const [goals, setGoals] = useState<DailyGoal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGoals = useCallback(async () => {
    if (!user) {
      setGoals([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('daily_goals')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today);

    if (error) {
      console.error('Error fetching daily goals:', error);
    } else {
      setGoals((data || []) as DailyGoal[]);
    }

    setLoading(false);
  }, [user]);

  const createDefaultGoals = async () => {
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];

    // Create default daily goals if none exist
    const defaultGoals = [
      { goal_type: 'videos', target: 5 },
      { goal_type: 'quizzes', target: 3 }
    ];

    for (const goal of defaultGoals) {
      const { error } = await supabase
        .from('daily_goals')
        .upsert({
          user_id: user.id,
          date: today,
          goal_type: goal.goal_type,
          target: goal.target,
          progress: 0,
          completed: false
        }, {
          onConflict: 'user_id,date,goal_type,subject'
        });

      if (error) {
        console.error('Error creating default goal:', error);
      }
    }

    await fetchGoals();
  };

  const incrementProgress = async (goalType: 'videos' | 'quizzes' | 'xp', amount: number = 1) => {
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];

    // Find existing goal
    const existingGoal = goals.find(g => g.goal_type === goalType && g.date === today);

    if (existingGoal) {
      const newProgress = existingGoal.progress + amount;
      const completed = newProgress >= existingGoal.target;

      const { error } = await supabase
        .from('daily_goals')
        .update({ progress: newProgress, completed })
        .eq('id', existingGoal.id);

      if (!error) {
        setGoals(prev => prev.map(g => 
          g.id === existingGoal.id 
            ? { ...g, progress: newProgress, completed }
            : g
        ));
      }
    }
  };

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  // Create default goals if none exist for today
  useEffect(() => {
    if (!loading && goals.length === 0 && user) {
      createDefaultGoals();
    }
  }, [loading, goals.length, user]);

  return { goals, loading, incrementProgress, refreshGoals: fetchGoals };
};
