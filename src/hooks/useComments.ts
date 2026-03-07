import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Comment {
  id: string;
  short_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
  username?: string;
  avatar_url?: string;
}

export const useComments = (shortId: string) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchComments = useCallback(async () => {
    if (!shortId) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('short_id', shortId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching comments:', error);
      setComments([]);
    } else if (data) {
      // Fetch usernames for comment authors
      const userIds = [...new Set(data.map((c: any) => c.user_id))];
      if (userIds.length > 0) {
        const { data: profiles } = await supabase.rpc('get_public_profiles', { p_user_ids: userIds });
        const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));
        
        setComments(data.map((c: any) => ({
          ...c,
          username: profileMap.get(c.user_id)?.username || 'User',
          avatar_url: profileMap.get(c.user_id)?.avatar_url || null,
        })));
      } else {
        setComments(data as Comment[]);
      }
    }
    setLoading(false);
  }, [shortId]);

  const addComment = async (content: string, parentId?: string) => {
    if (!user || !content.trim()) return;

    const { error } = await supabase
      .from('comments')
      .insert({
        short_id: shortId,
        user_id: user.id,
        content: content.trim(),
        parent_id: parentId || null,
      });

    if (!error) {
      await fetchComments();
    }
    return !error;
  };

  const deleteComment = async (commentId: string) => {
    if (!user) return;
    await supabase.from('comments').delete().eq('id', commentId).eq('user_id', user.id);
    await fetchComments();
  };

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  return { comments, loading, addComment, deleteComment, refetch: fetchComments };
};
