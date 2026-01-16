import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Repost {
  id: string;
  user_id: string;
  short_id: string;
  target_type: 'friend' | 'group';
  target_id: string;
  message: string | null;
  created_at: string;
  short?: {
    id: string;
    title: string;
    thumbnail_url: string | null;
    video_url: string;
  };
  sender?: {
    username: string | null;
    avatar_url: string | null;
  };
}

export const useReposts = () => {
  const { user } = useAuth();
  const [receivedReposts, setReceivedReposts] = useState<Repost[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReceivedReposts = useCallback(async () => {
    if (!user) {
      setReceivedReposts([]);
      setLoading(false);
      return;
    }

    try {
      // Get reposts sent to user directly (as friend)
      const { data: friendReposts, error: friendError } = await supabase
        .from('reposts')
        .select('*')
        .eq('target_type', 'friend')
        .eq('target_id', user.id)
        .order('created_at', { ascending: false });

      if (friendError) throw friendError;

      // Get user's group IDs
      const { data: memberships } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id);

      const groupIds = memberships?.map(m => m.group_id) || [];

      // Get reposts to user's groups
      let groupReposts: any[] = [];
      if (groupIds.length > 0) {
        const { data, error } = await supabase
          .from('reposts')
          .select('*')
          .eq('target_type', 'group')
          .in('target_id', groupIds)
          .order('created_at', { ascending: false });

        if (error) throw error;
        groupReposts = data || [];
      }

      // Combine and enrich
      const allReposts = [...(friendReposts || []), ...groupReposts];
      
      const enrichedReposts: Repost[] = await Promise.all(
        allReposts.map(async (repost) => {
          // Get short details
          const { data: short } = await supabase
            .from('shorts')
            .select('id, title, thumbnail_url, video_url')
            .eq('id', repost.short_id)
            .single();

          // Get sender profile
          const { data: sender } = await supabase
            .from('profiles')
            .select('username, avatar_url')
            .eq('id', repost.user_id)
            .single();

          return {
            ...repost,
            target_type: repost.target_type as 'friend' | 'group',
            short: short || undefined,
            sender: sender || undefined
          };
        })
      );

      setReceivedReposts(enrichedReposts);
    } catch (error) {
      console.error('Error fetching reposts:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const repostToFriend = async (shortId: string, friendId: string, message?: string) => {
    if (!user) return { error: 'Not authenticated' };

    try {
      const { error } = await supabase
        .from('reposts')
        .insert({
          user_id: user.id,
          short_id: shortId,
          target_type: 'friend',
          target_id: friendId,
          message
        });

      if (error) throw error;
      return { error: null };
    } catch (error: any) {
      console.error('Error reposting to friend:', error);
      return { error: error.message };
    }
  };

  const repostToGroup = async (shortId: string, groupId: string, message?: string) => {
    if (!user) return { error: 'Not authenticated' };

    try {
      const { error } = await supabase
        .from('reposts')
        .insert({
          user_id: user.id,
          short_id: shortId,
          target_type: 'group',
          target_id: groupId,
          message
        });

      if (error) throw error;
      return { error: null };
    } catch (error: any) {
      console.error('Error reposting to group:', error);
      return { error: error.message };
    }
  };

  useEffect(() => {
    fetchReceivedReposts();
  }, [fetchReceivedReposts]);

  return {
    receivedReposts,
    loading,
    repostToFriend,
    repostToGroup,
    refetch: fetchReceivedReposts
  };
};
