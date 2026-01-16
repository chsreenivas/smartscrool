import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, UserPlus, Check, Clock, Users, MessageCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useFriendships, FriendSearchResult } from '@/hooks/useFriendships';
import { toast } from 'sonner';

interface FriendsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onStartChat: (friendId: string) => void;
}

export const FriendsPanel = ({ isOpen, onClose, onStartChat }: FriendsPanelProps) => {
  const {
    friends,
    pendingRequests,
    sentRequests,
    loading,
    searchUsers,
    sendFriendRequest,
    respondToRequest
  } = useFriendships();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FriendSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'search'>('friends');

  const handleSearch = async () => {
    if (searchQuery.length < 2) return;
    setSearching(true);
    const results = await searchUsers(searchQuery);
    setSearchResults(results);
    setSearching(false);
  };

  const handleSendRequest = async (userId: string) => {
    const { error } = await sendFriendRequest(userId);
    if (error) {
      toast.error(error);
    } else {
      toast.success('Friend request sent!');
      setSearchResults(prev => prev.filter(u => u.id !== userId));
    }
  };

  const handleRespondToRequest = async (friendshipId: string, accept: boolean) => {
    const { error } = await respondToRequest(friendshipId, accept);
    if (error) {
      toast.error(error);
    } else {
      toast.success(accept ? 'Friend request accepted!' : 'Friend request declined');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-full sm:max-w-md bg-card rounded-t-2xl sm:rounded-2xl max-h-[80vh] overflow-hidden"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Users className="w-5 h-5" />
                Friends
              </h2>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b">
              {(['friends', 'requests', 'search'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-3 text-sm font-medium transition-colors ${
                    activeTab === tab
                      ? 'text-primary border-b-2 border-primary'
                      : 'text-muted-foreground'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  {tab === 'requests' && pendingRequests.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                      {pendingRequests.length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : (
                <>
                  {activeTab === 'friends' && (
                    <div className="space-y-3">
                      {friends.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p>No friends yet</p>
                          <p className="text-sm">Search for users to add them!</p>
                        </div>
                      ) : (
                        friends.map((friendship) => (
                          <div
                            key={friendship.id}
                            className="flex items-center justify-between p-3 rounded-xl bg-muted/50"
                          >
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
                              onClick={() => onStartChat(friendship.friend_profile!.id)}
                            >
                              <MessageCircle className="w-4 h-4" />
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {activeTab === 'requests' && (
                    <div className="space-y-3">
                      {pendingRequests.length === 0 && sentRequests.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p>No pending requests</p>
                        </div>
                      ) : (
                        <>
                          {pendingRequests.length > 0 && (
                            <>
                              <p className="text-sm font-medium text-muted-foreground mb-2">
                                Received Requests
                              </p>
                              {pendingRequests.map((request) => (
                                <div
                                  key={request.id}
                                  className="flex items-center justify-between p-3 rounded-xl bg-muted/50"
                                >
                                  <div className="flex items-center gap-3">
                                    <Avatar>
                                      <AvatarImage src={request.friend_profile?.avatar_url || undefined} />
                                      <AvatarFallback>
                                        {request.friend_profile?.username?.[0]?.toUpperCase() || '?'}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="font-medium">
                                      {request.friend_profile?.username || 'Unknown'}
                                    </span>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      onClick={() => handleRespondToRequest(request.id, true)}
                                    >
                                      <Check className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleRespondToRequest(request.id, false)}
                                    >
                                      <X className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </>
                          )}
                          {sentRequests.length > 0 && (
                            <>
                              <p className="text-sm font-medium text-muted-foreground mb-2 mt-4">
                                Sent Requests
                              </p>
                              {sentRequests.map((request) => (
                                <div
                                  key={request.id}
                                  className="flex items-center justify-between p-3 rounded-xl bg-muted/50"
                                >
                                  <div className="flex items-center gap-3">
                                    <Avatar>
                                      <AvatarImage src={request.friend_profile?.avatar_url || undefined} />
                                      <AvatarFallback>
                                        {request.friend_profile?.username?.[0]?.toUpperCase() || '?'}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="font-medium">
                                      {request.friend_profile?.username || 'Unknown'}
                                    </span>
                                  </div>
                                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> Pending
                                  </span>
                                </div>
                              ))}
                            </>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {activeTab === 'search' && (
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Search by username..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                        <Button onClick={handleSearch} disabled={searching}>
                          <Search className="w-4 h-4" />
                        </Button>
                      </div>

                      {searching ? (
                        <div className="flex justify-center py-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                        </div>
                      ) : searchResults.length > 0 ? (
                        <div className="space-y-3">
                          {searchResults.map((user) => (
                            <div
                              key={user.id}
                              className="flex items-center justify-between p-3 rounded-xl bg-muted/50"
                            >
                              <div className="flex items-center gap-3">
                                <Avatar>
                                  <AvatarImage src={user.avatar_url || undefined} />
                                  <AvatarFallback>
                                    {user.username[0]?.toUpperCase() || '?'}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-medium">{user.username}</span>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => handleSendRequest(user.id)}
                              >
                                <UserPlus className="w-4 h-4 mr-1" />
                                Add
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : searchQuery.length >= 2 ? (
                        <p className="text-center text-muted-foreground py-4">
                          No users found
                        </p>
                      ) : null}
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
