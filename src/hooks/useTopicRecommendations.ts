import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Recommendation {
  topic: string;
  reason: string;
  priority: number;
  slug: string;
}

export const useTopicRecommendations = () => {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendations = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: funcError } = await supabase.functions.invoke('recommend-topics');

      if (funcError) {
        console.error('Error fetching recommendations:', funcError);
        setError(funcError.message);
        return;
      }

      if (data?.recommendations) {
        setRecommendations(data.recommendations);
      }
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to get recommendations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchRecommendations();
    }
  }, [user]);

  return {
    recommendations,
    loading,
    error,
    refresh: fetchRecommendations
  };
};
