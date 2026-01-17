import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
  sender_profile?: {
    username: string | null;
    avatar_url: string | null;
  };
}

export interface Conversation {
  friend_id: string;
  friend_username: string | null;
  friend_avatar: string | null;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

export const useMessages = (friendId?: string) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = useCallback(async () => {
    if (!user || !friendId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await (supabase
        .from('messages' as any)
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true }) as any);

      if (error) throw error;

      // Enrich with sender profiles
      const enrichedMessages: Message[] = await Promise.all(
        ((data as any[]) || []).map(async (msg: any) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, avatar_url')
            .eq('id', msg.sender_id)
            .single();

          return {
            id: msg.id,
            sender_id: msg.sender_id,
            receiver_id: msg.receiver_id,
            content: msg.content,
            read_at: msg.read_at,
            created_at: msg.created_at,
            sender_profile: profile || undefined
          } as Message;
        })
      );

      setMessages(enrichedMessages);

      // Mark messages as read
      await (supabase
        .from('messages' as any)
        .update({ read_at: new Date().toISOString() })
        .eq('sender_id', friendId)
        .eq('receiver_id', user.id)
        .is('read_at', null) as any);

    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }, [user, friendId]);

  const fetchConversations = useCallback(async () => {
    if (!user) {
      setConversations([]);
      setLoading(false);
      return;
    }

    try {
      // Get all messages involving the user
      const { data: allMessages, error } = await (supabase
        .from('messages' as any)
        .select('*')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false }) as any);

      if (error) throw error;

      // Group by conversation partner
      const conversationMap = new Map<string, {
        messages: any[];
        lastMessage: any;
      }>();

      for (const msg of (allMessages as any[]) || []) {
        const partnerId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
        
        if (!conversationMap.has(partnerId)) {
          conversationMap.set(partnerId, {
            messages: [msg],
            lastMessage: msg
          });
        } else {
          conversationMap.get(partnerId)!.messages.push(msg);
        }
      }

      // Build conversation list
      const convos: Conversation[] = await Promise.all(
        Array.from(conversationMap.entries()).map(async ([partnerId, data]) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, avatar_url')
            .eq('id', partnerId)
            .single();

          const unreadCount = data.messages.filter(
            (m: any) => m.receiver_id === user.id && !m.read_at
          ).length;

          return {
            friend_id: partnerId,
            friend_username: profile?.username || null,
            friend_avatar: profile?.avatar_url || null,
            last_message: data.lastMessage.content,
            last_message_time: data.lastMessage.created_at,
            unread_count: unreadCount
          };
        })
      );

      setConversations(convos.sort((a, b) => 
        new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime()
      ));
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const sendMessage = async (receiverId: string, content: string) => {
    if (!user) return { error: 'Not authenticated' };

    try {
      const { error } = await (supabase
        .from('messages' as any)
        .insert({
          sender_id: user.id,
          receiver_id: receiverId,
          content
        }) as any);

      if (error) throw error;
      
      if (friendId) {
        await fetchMessages();
      }
      return { error: null };
    } catch (error: any) {
      console.error('Error sending message:', error);
      return { error: error.message };
    }
  };

  useEffect(() => {
    if (friendId) {
      fetchMessages();
    } else {
      fetchConversations();
    }
  }, [fetchMessages, fetchConversations, friendId]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('messages_realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`
        },
        () => {
          if (friendId) {
            fetchMessages();
          } else {
            fetchConversations();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, friendId, fetchMessages, fetchConversations]);

  return {
    messages,
    conversations,
    loading,
    sendMessage,
    refetch: friendId ? fetchMessages : fetchConversations
  };
};
