import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface LearningPath {
  id: string;
  title: string;
  description: string | null;
  category: string;
  icon: string;
  step_count: number;
  steps: LearningPathStep[];
  completedSteps: number;
}

export interface LearningPathStep {
  id: string;
  path_id: string;
  title: string;
  description: string | null;
  step_order: number;
  step_type: string;
  required_category: string | null;
  required_videos: number;
  completed: boolean;
  unlocked: boolean;
}

export const useLearningPaths = () => {
  const { user } = useAuth();
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPaths = useCallback(async () => {
    setLoading(true);

    // Fetch paths and steps
    const { data: pathsData } = await supabase
      .from('learning_paths')
      .select('*')
      .order('created_at');

    const { data: stepsData } = await supabase
      .from('learning_path_steps')
      .select('*')
      .order('step_order');

    // Fetch user progress if logged in
    let progressMap = new Map<string, boolean>();
    if (user) {
      const { data: progressData } = await supabase
        .from('user_path_progress')
        .select('step_id, completed')
        .eq('user_id', user.id);

      progressData?.forEach(p => {
        if (p.completed) progressMap.set(p.step_id, true);
      });
    }

    if (pathsData && stepsData) {
      const enrichedPaths: LearningPath[] = pathsData.map((path: any) => {
        const pathSteps = stepsData
          .filter((s: any) => s.path_id === path.id)
          .map((step: any, idx: number, arr: any[]) => {
            const completed = progressMap.get(step.id) || false;
            const prevCompleted = idx === 0 || progressMap.get(arr[idx - 1]?.id) || false;
            return {
              ...step,
              completed,
              unlocked: idx === 0 || prevCompleted,
            };
          });

        return {
          ...path,
          steps: pathSteps,
          completedSteps: pathSteps.filter((s: any) => s.completed).length,
        };
      });

      setPaths(enrichedPaths);
    }

    setLoading(false);
  }, [user]);

  const completeStep = async (stepId: string, pathId: string) => {
    if (!user) return;

    await supabase
      .from('user_path_progress')
      .upsert({
        user_id: user.id,
        path_id: pathId,
        step_id: stepId,
        completed: true,
        completed_at: new Date().toISOString(),
      }, { onConflict: 'user_id,step_id' });

    await fetchPaths();
  };

  useEffect(() => {
    fetchPaths();
  }, [fetchPaths]);

  return { paths, loading, completeStep, refetch: fetchPaths };
};
