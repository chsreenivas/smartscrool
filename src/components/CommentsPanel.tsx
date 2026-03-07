import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Trash2, Reply } from 'lucide-react';
import { useComments } from '@/hooks/useComments';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';

interface CommentsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  shortId: string;
}

export const CommentsPanel = ({ isOpen, onClose, shortId }: CommentsPanelProps) => {
  const { user } = useAuth();
  const { comments, loading, addComment, deleteComment } = useComments(shortId);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

  const handleSubmit = async () => {
    if (!newComment.trim()) return;
    const success = await addComment(newComment);
    if (success) setNewComment('');
  };

  const handleReply = async (parentId: string) => {
    if (!replyContent.trim()) return;
    const success = await addComment(replyContent, parentId);
    if (success) {
      setReplyContent('');
      setReplyTo(null);
    }
  };

  const topLevelComments = comments.filter(c => !c.parent_id);
  const getReplies = (parentId: string) => comments.filter(c => c.parent_id === parentId);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="absolute bottom-0 left-0 right-0 max-h-[70vh] bg-card rounded-t-2xl border-t border-border overflow-hidden flex flex-col"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-display font-bold text-foreground">
                Comments ({comments.length})
              </h3>
              <button onClick={onClose} className="p-1 hover:bg-secondary rounded-full">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                </div>
              ) : topLevelComments.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 text-sm">
                  No comments yet. Be the first!
                </p>
              ) : (
                topLevelComments.map(comment => (
                  <div key={comment.id} className="space-y-2">
                    {/* Main comment */}
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                        {comment.username?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-foreground">{comment.username}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-sm text-foreground mt-0.5">{comment.content}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <button
                            onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                            className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                          >
                            <Reply className="w-3 h-3" /> Reply
                          </button>
                          {user?.id === comment.user_id && (
                            <button
                              onClick={() => deleteComment(comment.id)}
                              className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1"
                            >
                              <Trash2 className="w-3 h-3" /> Delete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Reply input */}
                    {replyTo === comment.id && (
                      <div className="ml-11 flex gap-2">
                        <Input
                          placeholder="Write a reply..."
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleReply(comment.id)}
                          className="h-8 text-sm"
                        />
                        <Button size="sm" className="h-8 px-3" onClick={() => handleReply(comment.id)}>
                          <Send className="w-3 h-3" />
                        </Button>
                      </div>
                    )}

                    {/* Replies */}
                    {getReplies(comment.id).map(reply => (
                      <div key={reply.id} className="ml-11 flex gap-3">
                        <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-secondary-foreground flex-shrink-0">
                          {reply.username?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-foreground">{reply.username}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="text-xs text-foreground mt-0.5">{reply.content}</p>
                          {user?.id === reply.user_id && (
                            <button
                              onClick={() => deleteComment(reply.id)}
                              className="text-xs text-muted-foreground hover:text-destructive mt-1 flex items-center gap-1"
                            >
                              <Trash2 className="w-3 h-3" /> Delete
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>

            {/* Input */}
            {user && (
              <div className="p-4 border-t border-border flex gap-2">
                <Input
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                  className="flex-1"
                />
                <Button onClick={handleSubmit} size="icon" disabled={!newComment.trim()}>
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
