import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Short {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  category: string;
  likes_count: number;
  views_count: number;
  is_approved: boolean;
  created_at: string;
  isLiked?: boolean;
}

export const useShorts = (category?: string, searchQuery?: string) => {
  const { user } = useAuth();
  const [shorts, setShorts] = useState<Short[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchShorts = async () => {
    setLoading(true);
    
    let query = supabase
      .from('shorts')
      .select('*')
      .eq('is_approved', true)
      .order('created_at', { ascending: false });

    if (category && category !== 'All') {
      query = query.eq('category', category);
    }

    if (searchQuery) {
      query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
    }

    const { data, error } = await query;

    if (!error && data) {
      // Check which shorts the user has liked
      if (user) {
        const { data: likes } = await supabase
          .from('likes')
          .select('short_id')
          .eq('user_id', user.id);

        const likedIds = new Set(likes?.map(l => l.short_id) || []);
        setShorts(data.map(short => ({
          ...short,
          isLiked: likedIds.has(short.id)
        })) as Short[]);
      } else {
        setShorts(data as Short[]);
      }
    }
    setLoading(false);
  };

  const toggleLike = async (shortId: string) => {
    if (!user) return;

    const short = shorts.find(s => s.id === shortId);
    if (!short) return;

    if (short.isLiked) {
      // Delete like - trigger handles count update atomically
      await supabase
        .from('likes')
        .delete()
        .eq('user_id', user.id)
        .eq('short_id', shortId);

      // Update local state optimistically
      setShorts(prev => prev.map(s => 
        s.id === shortId 
          ? { ...s, isLiked: false, likes_count: Math.max(0, s.likes_count - 1) }
          : s
      ));
    } else {
      // Insert like - trigger handles count update atomically
      await supabase
        .from('likes')
        .insert({ user_id: user.id, short_id: shortId });

      // Update local state optimistically
      setShorts(prev => prev.map(s => 
        s.id === shortId 
          ? { ...s, isLiked: true, likes_count: s.likes_count + 1 }
          : s
      ));
    }
  };

  const recordView = async (shortId: string) => {
    if (!user) return 0;

    // Check if already viewed
    const { data: existingView } = await supabase
      .from('short_views')
      .select('id')
      .eq('user_id', user.id)
      .eq('short_id', shortId)
      .single();

    if (existingView) return 0;

    // Record new view - trigger handles views_count update atomically
    const xpEarned = 5;
    await supabase
      .from('short_views')
      .insert({ user_id: user.id, short_id: shortId, xp_earned: xpEarned });

    return xpEarned;
  };

  useEffect(() => {
    fetchShorts();
  }, [category, searchQuery, user]);

  return { shorts, loading, toggleLike, recordView, refetch: fetchShorts };
};
