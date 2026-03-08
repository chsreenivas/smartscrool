import { useState, useEffect, useCallback } from 'react';
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
  difficulty_level?: string;
  ai_summary?: string | null;
  topics?: string[];
  subtopic?: string | null;
}

const signVideoUrl = async (videoUrl: string): Promise<string> => {
  let storagePath: string | null = null;
  if (videoUrl && !videoUrl.startsWith('http')) {
    storagePath = videoUrl;
  } else if (videoUrl && videoUrl.includes('/storage/v1/object/public/videos/')) {
    storagePath = videoUrl.split('/storage/v1/object/public/videos/')[1];
  } else if (videoUrl && videoUrl.includes('/storage/v1/object/sign/videos/')) {
    return videoUrl; // already signed
  }

  if (storagePath) {
    const { data: signedData } = await supabase.storage
      .from('videos')
      .createSignedUrl(storagePath, 3600);
    if (signedData?.signedUrl) return signedData.signedUrl;
  }
  return videoUrl;
};

export const useShorts = (
  category?: string,
  searchQuery?: string,
  difficulty?: string | null,
  sortBy: 'popular' | 'newest' | 'relevant' = 'newest'
) => {
  const { user } = useAuth();
  const [shorts, setShorts] = useState<Short[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchShorts = useCallback(async () => {
    setLoading(true);

    let rawShorts: any[] = [];

    // Use recommendation algorithm for logged-in users on default feed
    if (user && !searchQuery) {
      const { data, error } = await supabase.rpc('get_recommended_feed', {
        p_user_id: user.id,
        p_category: category && category !== 'All' ? category : null,
        p_difficulty: difficulty || null,
        p_search: null,
        p_limit: 30,
      });

      if (error) {
        console.error('Recommendation feed error, falling back:', error);
        // Fallback to simple query
        rawShorts = await fetchSimple(category, searchQuery, difficulty, sortBy);
      } else {
        rawShorts = data || [];
      }
    } else {
      // Anonymous users or search mode: use simple query
      rawShorts = await fetchSimple(category, searchQuery, difficulty, sortBy);
    }

    if (rawShorts.length === 0) {
      setShorts([]);
      setLoading(false);
      return;
    }

    // Generate signed URLs in parallel
    const shortsWithUrls = await Promise.all(
      rawShorts.map(async (short: any) => ({
        ...short,
        video_url: await signVideoUrl(short.video_url),
      }))
    );

    // Check liked status for logged-in users
    if (user) {
      const { data: likes } = await supabase
        .from('likes')
        .select('short_id')
        .eq('user_id', user.id);

      const likedIds = new Set(likes?.map(l => l.short_id) || []);
      setShorts(shortsWithUrls.map(short => ({
        ...short,
        isLiked: likedIds.has(short.id),
      })) as Short[]);
    } else {
      setShorts(shortsWithUrls as Short[]);
    }

    setLoading(false);
  }, [category, searchQuery, difficulty, sortBy, user]);

  const toggleLike = async (shortId: string) => {
    if (!user) return;
    const short = shorts.find(s => s.id === shortId);
    if (!short) return;

    if (short.isLiked) {
      await supabase.from('likes').delete().eq('user_id', user.id).eq('short_id', shortId);
      setShorts(prev => prev.map(s =>
        s.id === shortId ? { ...s, isLiked: false, likes_count: Math.max(0, s.likes_count - 1) } : s
      ));
    } else {
      await supabase.from('likes').insert({ user_id: user.id, short_id: shortId });
      setShorts(prev => prev.map(s =>
        s.id === shortId ? { ...s, isLiked: true, likes_count: s.likes_count + 1 } : s
      ));
    }
  };

  const recordView = async (shortId: string) => {
    if (!user) return 0;
    const { data: existingView } = await supabase
      .from('short_views')
      .select('id')
      .eq('user_id', user.id)
      .eq('short_id', shortId)
      .single();

    if (existingView) return 0;

    const xpEarned = 5;
    await supabase
      .from('short_views')
      .insert({ user_id: user.id, short_id: shortId, xp_earned: xpEarned });

    return xpEarned;
  };

  useEffect(() => {
    fetchShorts();
  }, [fetchShorts]);

  return { shorts, loading, toggleLike, recordView, refetch: fetchShorts };
};

// Fallback simple query for anonymous users or when recommendation fails
async function fetchSimple(
  category?: string,
  searchQuery?: string,
  difficulty?: string | null,
  sortBy?: string
): Promise<any[]> {
  let query = supabase
    .from('shorts')
    .select('id, user_id, title, description, video_url, thumbnail_url, category, subtopic, likes_count, views_count, is_approved, created_at, difficulty_level, ai_summary, topics')
    .eq('is_approved', true);

  if (category && category !== 'All') query = query.eq('category', category);
  if (difficulty) query = query.eq('difficulty_level', difficulty);
  if (searchQuery) query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);

  switch (sortBy) {
    case 'popular':
      query = query.order('views_count', { ascending: false });
      break;
    case 'newest':
      query = query.order('created_at', { ascending: false });
      break;
    default:
      query = query.order('created_at', { ascending: false });
  }

  const { data, error } = await query.limit(30);
  if (error) {
    console.error('Error fetching shorts:', error);
    return [];
  }
  return data || [];
}
