import { motion } from 'framer-motion';
import { BookOpen, ExternalLink } from 'lucide-react';
import { EducationalCard } from '@/types/content';

interface FactCardProps {
  card: EducationalCard;
  index: number;
}

export const FactCard = ({ card, index }: FactCardProps) => {
  return (
    <motion.div
      className="w-full h-full flex items-center justify-center p-6"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      transition={{ duration: 0.4 }}
    >
      <div className="w-full max-w-md bg-gradient-card rounded-2xl shadow-elevated overflow-hidden border border-border/50">
        {/* Category Header */}
        <div className="px-6 pt-6 pb-4">
          <motion.div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-sm font-medium"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <span className="text-lg">{card.emoji}</span>
            <span>{card.category}</span>
          </motion.div>
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          <motion.h2
            className="font-display text-2xl font-bold mb-4 text-gradient-primary"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
          >
            {card.title}
          </motion.h2>
          
          <motion.p
            className="text-lg leading-relaxed text-foreground/90 mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {card.content}
          </motion.p>

          {card.source && (
            <motion.div
              className="flex items-center gap-2 text-sm text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
            >
              <BookOpen className="w-4 h-4" />
              <span>Source: {card.source}</span>
            </motion.div>
          )}
        </div>

        {/* Card Number */}
        <div className="px-6 pb-6 flex justify-between items-center">
          <span className="text-sm text-muted-foreground font-medium">
            #{index + 1}
          </span>
          <motion.div
            className="text-xs text-muted-foreground flex items-center gap-1"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span>Swipe for more</span>
            <span>↑</span>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};
