import { motion } from 'framer-motion';
import { Sparkles, GraduationCap } from 'lucide-react';

interface StarterFeedBannerProps {
  isVisible: boolean;
  onDismiss?: () => void;
}

export const StarterFeedBanner = ({ isVisible, onDismiss }: StarterFeedBannerProps) => {
  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="absolute top-20 left-1/2 -translate-x-1/2 z-30 pointer-events-none"
    >
      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 backdrop-blur-md border border-primary/30">
        <Sparkles className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium text-primary">Recommended to get started</span>
        <GraduationCap className="w-4 h-4 text-primary" />
      </div>
    </motion.div>
  );
};
