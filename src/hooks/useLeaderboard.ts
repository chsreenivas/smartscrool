import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface LeaderboardEntry {
  id: string;
  username: string | null;
  avatar_url: string | null;
  xp: number;
  streak: number;
  rank: number;
  isFriend?: boolean;
}

export type LeaderboardType = 'global' | 'friends' | 'weekly';

export const useLeaderboard = (type: LeaderboardType = 'global') => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);

    if (type === 'global') {
      const { data } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, xp, streak')
        .order('xp', { ascending: false })
        .limit(100);

      if (data) {
        const ranked = data.map((entry, index) => ({
          ...entry,
          rank: index + 1
        }));
        setEntries(ranked);

        if (user) {
          const userEntry = ranked.find(e => e.id === user.id);
          setUserRank(userEntry?.rank || null);
        }
      }
    } else if (type === 'friends' && user) {
      // Get friend IDs
      const { data: friendships } = await (supabase as any)
        .from('friendships')
        .select('requester_id, addressee_id')
        .eq('status', 'accepted')
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

      if (friendships) {
        const friendIds = friendships.map((f: any) =>
          f.requester_id === user.id ? f.addressee_id : f.requester_id
        );
        friendIds.push(user.id); // Include self

        const { data } = await supabase
          .from('profiles')
          .select('id, username, avatar_url, xp, streak')
          .in('id', friendIds)
          .order('xp', { ascending: false });

        if (data) {
          const ranked = data.map((entry, index) => ({
            ...entry,
            rank: index + 1,
            isFriend: entry.id !== user.id
          }));
          setEntries(ranked);

          const userEntry = ranked.find(e => e.id === user.id);
          setUserRank(userEntry?.rank || null);
        }
      }
    } else if (type === 'weekly') {
      // Weekly leaderboard based on streak
      const { data } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, xp, streak')
        .gt('streak', 0)
        .order('streak', { ascending: false })
        .order('xp', { ascending: false })
        .limit(50);

      if (data) {
        const ranked = data.map((entry, index) => ({
          ...entry,
          rank: index + 1
        }));
        setEntries(ranked);

        if (user) {
          const userEntry = ranked.find(e => e.id === user.id);
          setUserRank(userEntry?.rank || null);
        }
      }
    }

    setLoading(false);
  }, [type, user]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return { entries, userRank, loading, refetch: fetchLeaderboard };
};
