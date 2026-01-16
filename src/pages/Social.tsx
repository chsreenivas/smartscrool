import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Users, 
  Plus, 
  MessageCircle, 
  Bell,
  UserPlus,
  Mail
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useFriendships } from '@/hooks/useFriendships';
import { useGroups } from '@/hooks/useGroups';
import { useReposts } from '@/hooks/useReposts';
import { FriendsPanel } from '@/components/FriendsPanel';
import { ChatPanel } from '@/components/ChatPanel';
import { toast } from 'sonner';

const Social = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { friends, pendingRequests } = useFriendships();
  const { groups, invites, createGroup, respondToInvite } = useGroups();
  const { receivedReposts } = useReposts();

  const [activeTab, setActiveTab] = useState<'friends' | 'groups' | 'inbox'>('friends');
  const [showFriends, setShowFriends] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [selectedFriendId, setSelectedFriendId] = useState<string | undefined>();
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [createGroupOpen, setCreateGroupOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const handleStartChat = (friendId: string) => {
    setSelectedFriendId(friendId);
    setShowFriends(false);
    setShowChat(true);
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;
    
    const { error } = await createGroup(newGroupName.trim(), newGroupDescription.trim() || undefined);
    if (error) {
      toast.error(error);
    } else {
      toast.success('Group created!');
      setNewGroupName('');
      setNewGroupDescription('');
      setCreateGroupOpen(false);
    }
  };

  const handleRespondToInvite = async (inviteId: string, accept: boolean) => {
    const { error } = await respondToInvite(inviteId, accept);
    if (error) {
      toast.error(error);
    } else {
      toast.success(accept ? 'Joined group!' : 'Invite declined');
    }
  };

  const notificationCount = pendingRequests.length + invites.length + receivedReposts.length;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/feed')} className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold">Social</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowChat(true)}
              className="relative"
            >
              <MessageCircle className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setActiveTab('inbox')}
              className="relative"
            >
              <Bell className="w-5 h-5" />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                  {notificationCount}
                </span>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b">
        <div className="max-w-2xl mx-auto px-4 flex gap-4">
          {(['friends', 'groups', 'inbox'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 px-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === tab
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab === 'friends' && <Users className="w-4 h-4" />}
              {tab === 'groups' && <Users className="w-4 h-4" />}
              {tab === 'inbox' && <Mail className="w-4 h-4" />}
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === 'inbox' && notificationCount > 0 && (
                <span className="px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                  {notificationCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-2xl mx-auto p-4 space-y-4">
        {activeTab === 'friends' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Your Friends ({friends.length})</h2>
              <Button size="sm" onClick={() => setShowFriends(true)}>
                <UserPlus className="w-4 h-4 mr-1" />
                Add Friend
              </Button>
            </div>

            {friends.length === 0 ? (
              <Card className="p-8 text-center">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium">No friends yet</p>
                <p className="text-muted-foreground mb-4">Find and add friends to start sharing!</p>
                <Button onClick={() => setShowFriends(true)}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Find Friends
                </Button>
              </Card>
            ) : (
              <div className="grid gap-3">
                {friends.map((friendship) => (
                  <Card key={friendship.id}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={friendship.friend_profile?.avatar_url || undefined} />
                          <AvatarFallback>
                            {friendship.friend_profile?.username?.[0]?.toUpperCase() || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">
                          {friendship.friend_profile?.username || 'Unknown'}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleStartChat(friendship.friend_profile!.id)}
                      >
                        <MessageCircle className="w-4 h-4" />
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'groups' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Your Groups ({groups.length})</h2>
              <Dialog open={createGroupOpen} onOpenChange={setCreateGroupOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-1" />
                    Create Group
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create a Study Group</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <Input
                      placeholder="Group name"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                    />
                    <Input
                      placeholder="Description (optional)"
                      value={newGroupDescription}
                      onChange={(e) => setNewGroupDescription(e.target.value)}
                    />
                    <Button onClick={handleCreateGroup} className="w-full">
                      Create Group
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {groups.length === 0 ? (
              <Card className="p-8 text-center">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium">No groups yet</p>
                <p className="text-muted-foreground mb-4">Create a study group to share with friends!</p>
              </Card>
            ) : (
              <div className="grid gap-3">
                {groups.map((group) => (
                  <Card key={group.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                          <Users className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold">{group.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {group.member_count} members • {group.my_role}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'inbox' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <h2 className="text-lg font-semibold">Notifications</h2>

            {pendingRequests.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Friend Requests</p>
                {pendingRequests.map((request) => (
                  <Card key={request.id}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={request.friend_profile?.avatar_url || undefined} />
                          <AvatarFallback>
                            {request.friend_profile?.username?.[0]?.toUpperCase() || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">
                          {request.friend_profile?.username} wants to be friends
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {invites.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Group Invites</p>
                {invites.map((invite) => (
                  <Card key={invite.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{invite.group?.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Invited by {invite.inviter?.username}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleRespondToInvite(invite.id, true)}>
                            Join
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleRespondToInvite(invite.id, false)}>
                            Decline
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {receivedReposts.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Shared with You</p>
                {receivedReposts.map((repost) => (
                  <Card key={repost.id}>
                    <CardContent className="p-4">
                      <div className="flex gap-3">
                        <Avatar className="flex-shrink-0">
                          <AvatarImage src={repost.sender?.avatar_url || undefined} />
                          <AvatarFallback>
                            {repost.sender?.username?.[0]?.toUpperCase() || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium">
                            {repost.sender?.username} shared a video
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {repost.short?.title}
                          </p>
                          {repost.message && (
                            <p className="text-sm mt-1 italic">"{repost.message}"</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {notificationCount === 0 && (
              <Card className="p-8 text-center">
                <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium">All caught up!</p>
                <p className="text-muted-foreground">No new notifications</p>
              </Card>
            )}
          </motion.div>
        )}
      </main>

      <FriendsPanel
        isOpen={showFriends}
        onClose={() => setShowFriends(false)}
        onStartChat={handleStartChat}
      />

      <ChatPanel
        isOpen={showChat}
        onClose={() => { setShowChat(false); setSelectedFriendId(undefined); }}
        initialFriendId={selectedFriendId}
      />
    </div>
  );
};

export default Social;
