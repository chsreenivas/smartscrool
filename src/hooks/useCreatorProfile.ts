import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface CreatorProfile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  bio: string | null;
  xp: number;
  streak: number;
}

interface CreatorVideo {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  category: string;
  subtopic: string | null;
  views_count: number;
  likes_count: number;
  created_at: string;
}

export const useCreatorProfile = (creatorId: string) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [videos, setVideos] = useState<CreatorVideo[]>([]);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [videoCount, setVideoCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchCreatorData = useCallback(async () => {
    if (!creatorId) {
      setLoading(false);
      return;
    }

    try {
      // Fetch profile including banner_url
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, banner_url, bio, xp, streak')
        .eq('id', creatorId)
        .single();

      if (profileData) {
        setProfile(profileData);
      }

      // Fetch videos
      const { data: videosData } = await supabase
        .from('shorts')
        .select('id, title, description, video_url, thumbnail_url, category, subtopic, views_count, likes_count, created_at')
        .eq('user_id', creatorId)
        .eq('is_approved', true)
        .order('created_at', { ascending: false });

      if (videosData) {
        setVideos(videosData);
        setVideoCount(videosData.length);
      }

      // Fetch follower count
      const { count: followers } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', creatorId);

      setFollowerCount(followers || 0);

      // Fetch following count
      const { count: following } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', creatorId);

      setFollowingCount(following || 0);

      // Check if current user is following
      if (user) {
        const { data: followData } = await supabase
          .from('follows')
          .select('id')
          .eq('follower_id', user.id)
          .eq('following_id', creatorId)
          .single();

        setIsFollowing(!!followData);
      }
    } catch (error) {
      console.error('Error fetching creator data:', error);
    } finally {
      setLoading(false);
    }
  }, [creatorId, user]);

  useEffect(() => {
    fetchCreatorData();
  }, [fetchCreatorData]);

  const toggleFollow = async () => {
    if (!user || !creatorId) return;

    try {
      if (isFollowing) {
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', creatorId);

        setIsFollowing(false);
        setFollowerCount(prev => Math.max(0, prev - 1));
        toast.success('Unfollowed');
      } else {
        await supabase
          .from('follows')
          .insert({
            follower_id: user.id,
            following_id: creatorId,
          });

        setIsFollowing(true);
        setFollowerCount(prev => prev + 1);
        toast.success('Following!');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update follow status');
    }
  };

  return {
    profile,
    videos,
    followerCount,
    followingCount,
    videoCount,
    isFollowing,
    loading,
    toggleFollow,
    refetch: fetchCreatorData,
  };
};
