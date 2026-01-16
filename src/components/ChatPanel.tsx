import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useMessages, Conversation } from '@/hooks/useMessages';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  initialFriendId?: string;
}

export const ChatPanel = ({ isOpen, onClose, initialFriendId }: ChatPanelProps) => {
  const { user } = useAuth();
  const [selectedFriendId, setSelectedFriendId] = useState<string | undefined>(initialFriendId);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, conversations, loading, sendMessage } = useMessages(selectedFriendId);

  useEffect(() => {
    if (initialFriendId) {
      setSelectedFriendId(initialFriendId);
    }
  }, [initialFriendId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedFriendId) return;
    
    await sendMessage(selectedFriendId, newMessage.trim());
    setNewMessage('');
  };

  const selectedConversation = conversations.find(c => c.friend_id === selectedFriendId);

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
            className="w-full sm:max-w-md bg-card rounded-t-2xl sm:rounded-2xl h-[80vh] flex flex-col overflow-hidden"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25 }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b">
              {selectedFriendId ? (
                <>
                  <button
                    onClick={() => setSelectedFriendId(undefined)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <Avatar>
                    <AvatarImage src={selectedConversation?.friend_avatar || undefined} />
                    <AvatarFallback>
                      {selectedConversation?.friend_username?.[0]?.toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-semibold">
                    {selectedConversation?.friend_username || 'Chat'}
                  </span>
                </>
              ) : (
                <h2 className="text-lg font-semibold">Messages</h2>
              )}
              <button
                onClick={onClose}
                className="ml-auto text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : selectedFriendId ? (
                <div className="space-y-4">
                  {messages.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No messages yet. Say hi! 👋
                    </p>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] p-3 rounded-2xl ${
                            msg.sender_id === user?.id
                              ? 'bg-primary text-primary-foreground rounded-br-sm'
                              : 'bg-muted rounded-bl-sm'
                          }`}
                        >
                          <p>{msg.content}</p>
                          <p className={`text-xs mt-1 ${
                            msg.sender_id === user?.id ? 'text-primary-foreground/70' : 'text-muted-foreground'
                          }`}>
                            {format(new Date(msg.created_at), 'HH:mm')}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>
              ) : (
                <div className="space-y-3">
                  {conversations.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No conversations yet</p>
                      <p className="text-sm">Start chatting with your friends!</p>
                    </div>
                  ) : (
                    conversations.map((convo) => (
                      <button
                        key={convo.friend_id}
                        onClick={() => setSelectedFriendId(convo.friend_id)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors text-left"
                      >
                        <div className="relative">
                          <Avatar>
                            <AvatarImage src={convo.friend_avatar || undefined} />
                            <AvatarFallback>
                              {convo.friend_username?.[0]?.toUpperCase() || '?'}
                            </AvatarFallback>
                          </Avatar>
                          {convo.unread_count > 0 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                              {convo.unread_count}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">{convo.friend_username || 'Unknown'}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {convo.last_message}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(convo.last_message_time), 'HH:mm')}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Input */}
            {selectedFriendId && (
              <div className="p-4 border-t flex gap-2">
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  className="flex-1"
                />
                <Button onClick={handleSend} disabled={!newMessage.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
