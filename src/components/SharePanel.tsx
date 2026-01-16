import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, User, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useFriendships } from '@/hooks/useFriendships';
import { useGroups } from '@/hooks/useGroups';
import { useReposts } from '@/hooks/useReposts';
import { toast } from 'sonner';

interface SharePanelProps {
  shortId: string;
  shortTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

export const SharePanel = ({ shortId, shortTitle, isOpen, onClose }: SharePanelProps) => {
  const { friends } = useFriendships();
  const { groups } = useGroups();
  const { repostToFriend, repostToGroup } = useReposts();
  
  const [activeTab, setActiveTab] = useState<'friends' | 'groups'>('friends');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleShare = async () => {
    if (!selectedId) return;
    
    setSending(true);
    const { error } = activeTab === 'friends'
      ? await repostToFriend(shortId, selectedId, message || undefined)
      : await repostToGroup(shortId, selectedId, message || undefined);
    
    setSending(false);
    
    if (error) {
      toast.error(error);
    } else {
      toast.success(`Shared to ${activeTab === 'friends' ? 'friend' : 'group'}!`);
      onClose();
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
              <h2 className="text-lg font-semibold">Share "{shortTitle}"</h2>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b">
              <button
                onClick={() => { setActiveTab('friends'); setSelectedId(null); }}
                className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                  activeTab === 'friends'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-muted-foreground'
                }`}
              >
                <User className="w-4 h-4" />
                Friends
              </button>
              <button
                onClick={() => { setActiveTab('groups'); setSelectedId(null); }}
                className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                  activeTab === 'groups'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-muted-foreground'
                }`}
              >
                <Users className="w-4 h-4" />
                Groups
              </button>
            </div>

            {/* Content */}
            <div className="p-4 overflow-y-auto max-h-[40vh]">
              {activeTab === 'friends' ? (
                friends.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    No friends to share with yet
                  </p>
                ) : (
                  <div className="space-y-2">
                    {friends.map((friendship) => (
                      <button
                        key={friendship.id}
                        onClick={() => setSelectedId(friendship.friend_profile?.id || null)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
                          selectedId === friendship.friend_profile?.id
                            ? 'bg-primary/10 border-2 border-primary'
                            : 'bg-muted/50 hover:bg-muted'
                        }`}
                      >
                        <Avatar>
                          <AvatarImage src={friendship.friend_profile?.avatar_url || undefined} />
                          <AvatarFallback>
                            {friendship.friend_profile?.username?.[0]?.toUpperCase() || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">
                          {friendship.friend_profile?.username || 'Unknown'}
                        </span>
                      </button>
                    ))}
                  </div>
                )
              ) : (
                groups.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    No groups to share with yet
                  </p>
                ) : (
                  <div className="space-y-2">
                    {groups.map((group) => (
                      <button
                        key={group.id}
                        onClick={() => setSelectedId(group.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
                          selectedId === group.id
                            ? 'bg-primary/10 border-2 border-primary'
                            : 'bg-muted/50 hover:bg-muted'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                          <Users className="w-5 h-5 text-primary" />
                        </div>
                        <div className="text-left">
                          <p className="font-medium">{group.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {group.member_count} members
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )
              )}
            </div>

            {/* Message Input */}
            {selectedId && (
              <div className="p-4 border-t space-y-4">
                <Textarea
                  placeholder="Add a message (optional)..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="resize-none"
                  rows={2}
                />
                <Button
                  onClick={handleShare}
                  disabled={sending}
                  className="w-full"
                >
                  {sending ? (
                    'Sharing...'
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Share
                    </>
                  )}
                </Button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
