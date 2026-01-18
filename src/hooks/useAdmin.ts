import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface PendingShort {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  category: string;
  created_at: string;
  uploader?: {
    username: string | null;
    avatar_url: string | null;
  };
}

export interface VideoAnalytics {
  id: string;
  short_id: string;
  views_count: number;
  likes_count: number;
  completion_rate: number;
  avg_watch_time_seconds: number;
  updated_at: string;
  short?: {
    title: string;
    category: string;
  };
}

export interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'moderator' | 'user';
  created_at: string;
}

export const useAdmin = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isModerator, setIsModerator] = useState(false);
  const [pendingShorts, setPendingShorts] = useState<PendingShort[]>([]);
  const [analytics, setAnalytics] = useState<VideoAnalytics[]>([]);
  const [loading, setLoading] = useState(true);

  const checkRole = useCallback(async () => {
    if (!user) {
      setIsAdmin(false);
      setIsModerator(false);
      return;
    }

    try {
      const { data: adminCheck } = await (supabase as any)
        .rpc('has_role', { _user_id: user.id, _role: 'admin' });
      
      const { data: modCheck } = await (supabase as any)
        .rpc('has_role', { _user_id: user.id, _role: 'moderator' });

      setIsAdmin(adminCheck || false);
      setIsModerator(modCheck || false);
    } catch (error) {
      console.error('Error checking role:', error);
    }
  }, [user]);

  const fetchPendingShorts = useCallback(async () => {
    if (!user || (!isAdmin && !isModerator)) {
      setPendingShorts([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('shorts')
        .select('*')
        .eq('is_approved', false)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Enrich with uploader info
      const enriched: PendingShort[] = await Promise.all(
        (data || []).map(async (short) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, avatar_url')
            .eq('id', short.user_id)
            .single();

          return {
            ...short,
            uploader: profile || undefined
          };
        })
      );

      setPendingShorts(enriched);
    } catch (error) {
      console.error('Error fetching pending shorts:', error);
    }
  }, [user, isAdmin, isModerator]);

  const fetchAnalytics = useCallback(async () => {
    if (!user || (!isAdmin && !isModerator)) {
      setAnalytics([]);
      return;
    }

    try {
      const { data, error } = await (supabase
        .from('video_analytics' as any)
        .select('*')
        .order('views_count', { ascending: false })
        .limit(50) as any);

      if (error) throw error;

      // Enrich with short info
      const enriched: VideoAnalytics[] = await Promise.all(
        ((data as any[]) || []).map(async (item: any) => {
          const { data: short } = await supabase
            .from('shorts')
            .select('title, category')
            .eq('id', item.short_id)
            .single();

          return {
            id: item.id,
            short_id: item.short_id,
            views_count: item.views_count || 0,
            likes_count: item.likes_count || 0,
            completion_rate: item.completion_rate || 0,
            avg_watch_time_seconds: item.avg_watch_time_seconds || 0,
            updated_at: item.updated_at,
            short: short || undefined
          } as VideoAnalytics;
        })
      );

      setAnalytics(enriched);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  }, [user, isAdmin, isModerator]);

  const approveShort = async (shortId: string) => {
    if (!user || (!isAdmin && !isModerator)) {
      return { error: 'Not authorized' };
    }

    try {
      const { error } = await supabase
        .from('shorts')
        .update({ is_approved: true })
        .eq('id', shortId);

      if (error) throw error;
      await fetchPendingShorts();
      return { error: null };
    } catch (error: any) {
      console.error('Error approving short:', error);
      return { error: error.message };
    }
  };

  const rejectShort = async (shortId: string) => {
    if (!user || (!isAdmin && !isModerator)) {
      return { error: 'Not authorized' };
    }

    try {
      // Delete the video
      const { error } = await supabase
        .from('shorts')
        .delete()
        .eq('id', shortId);

      if (error) throw error;
      await fetchPendingShorts();
      return { error: null };
    } catch (error: any) {
      console.error('Error rejecting short:', error);
      return { error: error.message };
    }
  };

  const getOverallStats = async () => {
    try {
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const { count: totalShorts } = await supabase
        .from('shorts')
        .select('*', { count: 'exact', head: true })
        .eq('is_approved', true);

      const { count: totalViews } = await supabase
        .from('short_views')
        .select('*', { count: 'exact', head: true });

      const { data: xpData } = await supabase
        .from('profiles')
        .select('xp');

      const totalXP = xpData?.reduce((sum, p) => sum + (p.xp || 0), 0) || 0;

      return {
        totalUsers: totalUsers || 0,
        totalShorts: totalShorts || 0,
        totalViews: totalViews || 0,
        totalXP
      };
    } catch (error) {
      console.error('Error getting stats:', error);
      return { totalUsers: 0, totalShorts: 0, totalViews: 0, totalXP: 0 };
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await checkRole();
      setLoading(false);
    };
    init();
  }, [checkRole]);

  useEffect(() => {
    if (isAdmin || isModerator) {
      fetchPendingShorts();
      fetchAnalytics();
    }
  }, [isAdmin, isModerator, fetchPendingShorts, fetchAnalytics]);

  return {
    isAdmin,
    isModerator,
    pendingShorts,
    analytics,
    loading,
    approveShort,
    rejectShort,
    getOverallStats,
    refetch: () => {
      fetchPendingShorts();
      fetchAnalytics();
    }
  };
};
