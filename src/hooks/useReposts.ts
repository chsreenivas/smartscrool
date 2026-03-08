import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Repost {
  id: string;
  sender_id: string;
  short_id: string;
  recipient_id: string | null;
  group_id: string | null;
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
      // Get reposts sent to user directly
      const { data: friendReposts, error: friendError } = await supabase
        .from('reposts')
        .select('*')
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false });

      if (friendError) throw friendError;

      // Get user's group IDs
      const { data: memberships } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id);

      const groupIds = (memberships || []).map(m => m.group_id);

      // Get reposts to user's groups
      let groupReposts: typeof friendReposts = [];
      if (groupIds.length > 0) {
        const { data, error } = await supabase
          .from('reposts')
          .select('*')
          .in('group_id', groupIds)
          .order('created_at', { ascending: false });

        if (error) throw error;
        groupReposts = data || [];
      }

      // Combine and enrich
      const allReposts = [...(friendReposts || []), ...(groupReposts || [])];
      
      const enrichedReposts: Repost[] = await Promise.all(
        allReposts.map(async (repost) => {
          const { data: short } = await supabase
            .from('shorts')
            .select('id, title, thumbnail_url, video_url')
            .eq('id', repost.short_id)
            .single();

          const { data: sender } = await supabase
            .from('profiles')
            .select('username, avatar_url')
            .eq('id', repost.sender_id)
            .single();

          return {
            id: repost.id,
            sender_id: repost.sender_id,
            short_id: repost.short_id,
            recipient_id: repost.recipient_id,
            group_id: repost.group_id,
            message: repost.message,
            created_at: repost.created_at,
            short: short || undefined,
            sender: sender || undefined
          } as Repost;
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
          sender_id: user.id,
          short_id: shortId,
          recipient_id: friendId,
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
          sender_id: user.id,
          short_id: shortId,
          group_id: groupId,
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
