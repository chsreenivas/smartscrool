import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Flag, Send } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  shortId: string;
  shortTitle: string;
}

const reportReasons = [
  { id: 'non_educational', label: 'Not Educational', description: 'Content is entertainment-only or off-topic' },
  { id: 'inappropriate', label: 'Inappropriate Content', description: 'Contains harmful or offensive material' },
  { id: 'spam', label: 'Spam', description: 'Repetitive or promotional content' },
  { id: 'copyright', label: 'Copyright Issue', description: 'Uses copyrighted material without permission' },
  { id: 'other', label: 'Other', description: 'Describe the issue below' },
];

export const ReportModal = ({ isOpen, onClose, shortId, shortTitle }: ReportModalProps) => {
  const { user } = useAuth();
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user || !selectedReason) return;

    setIsSubmitting(true);

    const { error } = await (supabase as any)
      .from('content_reports')
      .insert({
        short_id: shortId,
        reporter_id: user.id,
        reason: selectedReason,
        description: description || null
      });

    if (error) {
      toast.error('Failed to submit report');
    } else {
      toast.success('Report submitted. Thank you for helping keep BrainScroll educational!');
      onClose();
    }

    setIsSubmitting(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-x-4 top-1/2 -translate-y-1/2 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-md bg-card rounded-2xl overflow-hidden shadow-elevated"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
          >
            {/* Header */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flag className="w-5 h-5 text-destructive" />
                  <h2 className="font-display text-lg font-bold">Report Content</h2>
                </div>
                <button onClick={onClose} className="p-2 -mr-2 hover:bg-secondary rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-muted-foreground mt-1 truncate">
                "{shortTitle}"
              </p>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {/* Warning */}
              <div className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-destructive">Help us stay educational</p>
                  <p className="text-muted-foreground mt-1">
                    BrainScroll is for learning only. Report content that doesn't belong.
                  </p>
                </div>
              </div>

              {/* Reasons */}
              <div className="space-y-2">
                <label className="text-sm font-medium">What's the issue?</label>
                {reportReasons.map((reason) => (
                  <button
                    key={reason.id}
                    onClick={() => setSelectedReason(reason.id)}
                    className={`w-full p-3 rounded-lg border text-left transition-all ${
                      selectedReason === reason.id
                        ? 'bg-destructive/10 border-destructive/50'
                        : 'bg-secondary/50 border-border hover:border-destructive/30'
                    }`}
                  >
                    <p className="font-medium text-sm">{reason.label}</p>
                    <p className="text-xs text-muted-foreground">{reason.description}</p>
                  </button>
                ))}
              </div>

              {/* Additional Details */}
              {selectedReason && (
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Additional details (optional)
                  </label>
                  <Textarea
                    placeholder="Tell us more..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    maxLength={500}
                  />
                </div>
              )}

              {/* Submit */}
              <Button
                onClick={handleSubmit}
                disabled={!selectedReason || isSubmitting}
                className="w-full bg-destructive hover:bg-destructive/90"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Submitting...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Send className="w-4 h-4" />
                    Submit Report
                  </span>
                )}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
