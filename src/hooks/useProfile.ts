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

  const addXP = async (amount: number) => {
    if (!user || !profile) return;

    const today = new Date().toISOString().split('T')[0];
    const lastActivity = profile.last_activity_date;
    
    let newStreak = profile.streak;
    if (lastActivity) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      if (lastActivity === yesterdayStr) {
        newStreak = profile.streak + 1;
      } else if (lastActivity !== today) {
        newStreak = 1;
      }
    } else {
      newStreak = 1;
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        xp: profile.xp + amount,
        streak: newStreak,
        last_activity_date: today,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (!error) {
      setProfile(prev => prev ? {
        ...prev,
        xp: prev.xp + amount,
        streak: newStreak,
        last_activity_date: today
      } : null);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  return { profile, loading, updateInterests, addXP, refetch: fetchProfile };
};
