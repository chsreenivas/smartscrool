import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type FriendshipStatus = 'pending' | 'accepted' | 'rejected' | 'blocked';

export interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: FriendshipStatus;
  created_at: string;
  updated_at: string;
  friend_profile?: {
    id: string;
    username: string | null;
    avatar_url: string | null;
  };
}

export interface FriendSearchResult {
  id: string;
  username: string;
  avatar_url: string | null;
}

export const useFriendships = () => {
  const { user } = useAuth();
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Friendship[]>([]);
  const [sentRequests, setSentRequests] = useState<Friendship[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFriendships = useCallback(async () => {
    if (!user) {
      setFriends([]);
      setPendingRequests([]);
      setSentRequests([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('friendships' as any)
        .select('*')
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

      if (error) throw error;

      const friendshipsWithProfiles: Friendship[] = [];
      const pending: Friendship[] = [];
      const sent: Friendship[] = [];

      for (const friendship of (data as any[]) || []) {
        const friendId = friendship.requester_id === user.id 
          ? friendship.addressee_id 
          : friendship.requester_id;

        const { data: profile } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .eq('id', friendId)
          .single();

        const enrichedFriendship: Friendship = {
          ...friendship,
          friend_profile: profile || undefined
        };

        if (friendship.status === 'accepted') {
          friendshipsWithProfiles.push(enrichedFriendship);
        } else if (friendship.status === 'pending') {
          if (friendship.addressee_id === user.id) {
            pending.push(enrichedFriendship);
          } else {
            sent.push(enrichedFriendship);
          }
        }
      }

      setFriends(friendshipsWithProfiles);
      setPendingRequests(pending);
      setSentRequests(sent);
    } catch (error) {
      console.error('Error fetching friendships:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const searchUsers = async (query: string): Promise<FriendSearchResult[]> => {
    if (!user || query.length < 2) return [];

    try {
      const { data, error } = await supabase
        .rpc('search_users_by_username' as any, { search_query: query });

      if (error) throw error;

      const friendIds = friends.map(f => f.friend_profile?.id);
      return ((data as FriendSearchResult[]) || []).filter(
        u => u.id !== user.id && !friendIds.includes(u.id)
      );
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  };

  const sendFriendRequest = async (addresseeId: string) => {
    if (!user) return { error: 'Not authenticated' };

    try {
      const { error } = await supabase
        .from('friendships' as any)
        .insert({
          requester_id: user.id,
          addressee_id: addresseeId,
          status: 'pending'
        });

      if (error) throw error;
      await fetchFriendships();
      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    }
  };

  const respondToRequest = async (friendshipId: string, accept: boolean) => {
    if (!user) return { error: 'Not authenticated' };

    try {
      const { error } = await supabase
        .from('friendships' as any)
        .update({ 
          status: accept ? 'accepted' : 'rejected',
          updated_at: new Date().toISOString()
        })
        .eq('id', friendshipId)
        .eq('addressee_id', user.id);

      if (error) throw error;
      await fetchFriendships();
      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    }
  };

  const removeFriend = async (friendshipId: string) => {
    if (!user) return { error: 'Not authenticated' };

    try {
      const { error } = await supabase
        .from('friendships' as any)
        .delete()
        .eq('id', friendshipId);

      if (error) throw error;
      await fetchFriendships();
      return { error: null };
    } catch (error: any) {
      return { error: error.message };
    }
  };

  const areFriends = async (otherUserId: string): Promise<boolean> => {
    if (!user) return false;
    try {
      const { data } = await supabase
        .rpc('are_friends' as any, { user_id_1: user.id, user_id_2: otherUserId });
      return data || false;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    fetchFriendships();
  }, [fetchFriendships]);

  return {
    friends,
    pendingRequests,
    sentRequests,
    loading,
    searchUsers,
    sendFriendRequest,
    respondToRequest,
    removeFriend,
    areFriends,
    refetch: fetchFriendships
  };
};
