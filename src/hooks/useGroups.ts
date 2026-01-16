import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type GroupRole = 'admin' | 'moderator' | 'member';

export interface Group {
  id: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  created_by: string;
  created_at: string;
  member_count?: number;
  my_role?: GroupRole;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: GroupRole;
  joined_at: string;
  profile?: {
    username: string | null;
    avatar_url: string | null;
  };
}

export interface GroupInvite {
  id: string;
  group_id: string;
  inviter_id: string;
  invitee_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  group?: Group;
  inviter?: {
    username: string | null;
  };
}

export const useGroups = () => {
  const { user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [invites, setInvites] = useState<GroupInvite[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGroups = useCallback(async () => {
    if (!user) {
      setGroups([]);
      setInvites([]);
      setLoading(false);
      return;
    }

    try {
      const { data: memberships, error: memberError } = await supabase
        .from('group_members' as any)
        .select('group_id, role')
        .eq('user_id', user.id);

      if (memberError) throw memberError;

      const groupIds = (memberships as any[])?.map(m => m.group_id) || [];
      
      if (groupIds.length > 0) {
        const { data: groupsData } = await supabase
          .from('groups' as any)
          .select('*')
          .in('id', groupIds);

        const enrichedGroups: Group[] = await Promise.all(
          ((groupsData as any[]) || []).map(async (group) => {
            const { count } = await supabase
              .from('group_members' as any)
              .select('*', { count: 'exact', head: true })
              .eq('group_id', group.id);

            const membership = (memberships as any[])?.find(m => m.group_id === group.id);
            return {
              ...group,
              member_count: count || 0,
              my_role: membership?.role as GroupRole
            };
          })
        );
        setGroups(enrichedGroups);
      } else {
        setGroups([]);
      }

      const { data: invitesData } = await supabase
        .from('group_invites' as any)
        .select('*')
        .eq('invitee_id', user.id)
        .eq('status', 'pending');

      setInvites((invitesData as GroupInvite[]) || []);

      // Fetch pending invites
      const { data: invitesData, error: invitesError } = await supabase
        .from('group_invites')
        .select('*')
        .eq('invitee_id', user.id)
        .eq('status', 'pending');

      if (invitesError) throw invitesError;

      // Enrich invites with group and inviter info
      const enrichedInvites: GroupInvite[] = await Promise.all(
        (invitesData || []).map(async (invite) => {
          const { data: group } = await supabase
            .from('groups')
            .select('*')
            .eq('id', invite.group_id)
            .single();

          const { data: inviter } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', invite.inviter_id)
            .single();

          return {
            ...invite,
            status: invite.status as 'pending' | 'accepted' | 'rejected',
            group: group || undefined,
            inviter: inviter || undefined
          };
        })
      );

      setInvites(enrichedInvites);
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const createGroup = async (name: string, description?: string) => {
    if (!user) return { error: 'Not authenticated', data: null };

    try {
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .insert({
          name,
          description,
          created_by: user.id
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // Add creator as admin
      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: group.id,
          user_id: user.id,
          role: 'admin'
        });

      if (memberError) throw memberError;

      await fetchGroups();
      return { error: null, data: group };
    } catch (error: any) {
      console.error('Error creating group:', error);
      return { error: error.message, data: null };
    }
  };

  const inviteToGroup = async (groupId: string, inviteeId: string) => {
    if (!user) return { error: 'Not authenticated' };

    try {
      const { error } = await supabase
        .from('group_invites')
        .insert({
          group_id: groupId,
          inviter_id: user.id,
          invitee_id: inviteeId,
          status: 'pending'
        });

      if (error) throw error;
      return { error: null };
    } catch (error: any) {
      console.error('Error inviting to group:', error);
      return { error: error.message };
    }
  };

  const respondToInvite = async (inviteId: string, accept: boolean) => {
    if (!user) return { error: 'Not authenticated' };

    try {
      const invite = invites.find(i => i.id === inviteId);
      if (!invite) throw new Error('Invite not found');

      // Update invite status
      const { error: updateError } = await supabase
        .from('group_invites')
        .update({ status: accept ? 'accepted' : 'rejected' })
        .eq('id', inviteId);

      if (updateError) throw updateError;

      // If accepted, add user to group
      if (accept) {
        const { error: memberError } = await supabase
          .from('group_members')
          .insert({
            group_id: invite.group_id,
            user_id: user.id,
            role: 'member'
          });

        if (memberError) throw memberError;
      }

      await fetchGroups();
      return { error: null };
    } catch (error: any) {
      console.error('Error responding to invite:', error);
      return { error: error.message };
    }
  };

  const leaveGroup = async (groupId: string) => {
    if (!user) return { error: 'Not authenticated' };

    try {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', user.id);

      if (error) throw error;
      await fetchGroups();
      return { error: null };
    } catch (error: any) {
      console.error('Error leaving group:', error);
      return { error: error.message };
    }
  };

  const getGroupMembers = async (groupId: string): Promise<GroupMember[]> => {
    try {
      const { data, error } = await supabase
        .from('group_members')
        .select('*')
        .eq('group_id', groupId);

      if (error) throw error;

      // Enrich with profile data
      const enrichedMembers: GroupMember[] = await Promise.all(
        (data || []).map(async (member) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('username, avatar_url')
            .eq('id', member.user_id)
            .single();

          return {
            ...member,
            role: member.role as GroupRole,
            profile: profile || undefined
          };
        })
      );

      return enrichedMembers;
    } catch (error) {
      console.error('Error fetching group members:', error);
      return [];
    }
  };

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  return {
    groups,
    invites,
    loading,
    createGroup,
    inviteToGroup,
    respondToInvite,
    leaveGroup,
    getGroupMembers,
    refetch: fetchGroups
  };
};
