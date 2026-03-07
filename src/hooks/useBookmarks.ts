import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Bookmark {
  id: string;
  user_id: string;
  short_id: string;
  created_at: string;
}

export const useBookmarks = () => {
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [bookmarkList, setBookmarkList] = useState<Bookmark[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookmarks = useCallback(async () => {
    if (!user) {
      setBookmarks(new Set());
      setBookmarkList([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('bookmarks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setBookmarks(new Set(data.map((b: any) => b.short_id)));
      setBookmarkList(data as Bookmark[]);
    }
    setLoading(false);
  }, [user]);

  const toggleBookmark = async (shortId: string) => {
    if (!user) return;

    if (bookmarks.has(shortId)) {
      await supabase.from('bookmarks').delete().eq('user_id', user.id).eq('short_id', shortId);
      setBookmarks(prev => {
        const next = new Set(prev);
        next.delete(shortId);
        return next;
      });
      setBookmarkList(prev => prev.filter(b => b.short_id !== shortId));
    } else {
      const { data } = await supabase
        .from('bookmarks')
        .insert({ user_id: user.id, short_id: shortId })
        .select()
        .single();
      
      if (data) {
        setBookmarks(prev => new Set(prev).add(shortId));
        setBookmarkList(prev => [data as Bookmark, ...prev]);
      }
    }
  };

  const isBookmarked = (shortId: string) => bookmarks.has(shortId);

  useEffect(() => {
    fetchBookmarks();
  }, [fetchBookmarks]);

  return { bookmarks, bookmarkList, loading, toggleBookmark, isBookmarked, refetch: fetchBookmarks };
};
