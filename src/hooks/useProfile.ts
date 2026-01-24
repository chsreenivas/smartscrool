import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Profile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  xp: number;
  streak: number;
  last_activity_date: string | null;
  interests: string[];
  created_at: string;
  updated_at: string;
}

export const useProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!error && data) {
      setProfile(data as Profile);
    }
    setLoading(false);
  };

  const updateInterests = async (interests: string[]) => {
    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .update({ interests })
      .eq('id', user.id);

    if (!error) {
      setProfile(prev => prev ? { ...prev, interests } : null);
    }
  };

  const updateUsername = async (username: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .update({ username })
      .eq('id', user.id);

    if (!error) {
      setProfile(prev => prev ? { ...prev, username } : null);
    }
  };

  const updateAvatar = async (avatar_url: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .update({ avatar_url })
      .eq('id', user.id);

    if (!error) {
      setProfile(prev => prev ? { ...prev, avatar_url } : null);
    }
  };

  // Use secure server-side function to award XP
  // This prevents client-side XP manipulation
  const addXP = async (amount: number, source: 'view' | 'quiz' | 'achievement' | 'streak' = 'view', referenceId?: string) => {
    if (!user || !profile) return;

    try {
      const { error } = await supabase.rpc('award_xp', {
        p_user_id: user.id,
        p_amount: amount,
        p_source: source,
        p_reference_id: referenceId || null
      });

      if (error) {
        console.error('Error awarding XP:', error);
        return;
      }

      // Refetch profile to get updated values
      await fetchProfile();
    } catch (error) {
      console.error('Error in addXP:', error);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  return { profile, loading, updateInterests, updateUsername, updateAvatar, addXP, refetch: fetchProfile };
};
