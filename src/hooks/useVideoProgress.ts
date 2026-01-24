import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface VideoProgress {
  id: string;
  user_id: string;
  short_id: string;
  completed: boolean;
  time_spent: number;
  last_position: number;
  created_at: string;
  updated_at: string;
}

export const useVideoProgress = () => {
  const { user } = useAuth();
  const [progressMap, setProgressMap] = useState<Map<string, VideoProgress>>(new Map());
  const [loading, setLoading] = useState(true);

  const fetchProgress = useCallback(async () => {
    if (!user) {
      setProgressMap(new Map());
      setLoading(false);
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from('user_video_progress')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching video progress:', error);
    } else {
      const map = new Map<string, VideoProgress>();
      (data || []).forEach((p: VideoProgress) => {
        map.set(p.short_id, p);
      });
      setProgressMap(map);
    }

    setLoading(false);
  }, [user]);

  const updateProgress = async (
    shortId: string, 
    updates: { completed?: boolean; time_spent?: number; last_position?: number }
  ) => {
    if (!user) return;

    const existing = progressMap.get(shortId);

    if (existing) {
      const { error } = await supabase
        .from('user_video_progress')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);

      if (!error) {
        setProgressMap(prev => {
          const newMap = new Map(prev);
          newMap.set(shortId, { ...existing, ...updates });
          return newMap;
        });
      }
    } else {
      const { data, error } = await supabase
        .from('user_video_progress')
        .insert({
          user_id: user.id,
          short_id: shortId,
          ...updates
        })
        .select()
        .single();

      if (!error && data) {
        setProgressMap(prev => {
          const newMap = new Map(prev);
          newMap.set(shortId, data as VideoProgress);
          return newMap;
        });
      }
    }
  };

  const markCompleted = async (shortId: string) => {
    await updateProgress(shortId, { completed: true });
  };

  const getProgress = (shortId: string) => {
    return progressMap.get(shortId);
  };

  const getLastWatchedShortId = () => {
    let latest: VideoProgress | null = null;
    progressMap.forEach((p) => {
      if (!p.completed && (!latest || p.updated_at > latest.updated_at)) {
        latest = p;
      }
    });
    return latest?.short_id || null;
  };

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  return { 
    progressMap, 
    loading, 
    updateProgress, 
    markCompleted, 
    getProgress,
    getLastWatchedShortId,
    refreshProgress: fetchProgress 
  };
};
