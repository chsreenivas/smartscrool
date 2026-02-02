import { motion } from 'framer-motion';
import { Lock, CheckCircle } from 'lucide-react';
import { SafariCarousel } from './SafariCarousel';

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  xp_reward: number;
  isEarned: boolean;
}

interface BadgeCarouselProps {
  badges: Badge[];
  title?: string;
}

export const BadgeCarousel = ({ badges, title = 'Badges' }: BadgeCarouselProps) => {
  return (
    <SafariCarousel title={title}>
      {badges.map((badge, index) => (
        <motion.div
          key={badge.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          whileHover={{ scale: 1.08, y: -4 }}
          className={`relative w-28 p-3 rounded-xl border safari-card hover-lift hover-glow cursor-pointer ${
            badge.isEarned 
              ? 'border-primary/50 bg-gradient-to-br from-primary/10 to-accent/10' 
              : 'border-border opacity-60 hover:opacity-80'
          }`}
        >
          {/* Status Icon */}
          <div className="absolute top-2 right-2">
            {badge.isEarned ? (
              <CheckCircle className="w-3 h-3 text-success" />
            ) : (
              <Lock className="w-3 h-3 text-muted-foreground" />
            )}
          </div>

          {/* Badge Icon */}
          <div className="text-3xl mb-2 text-center">{badge.icon}</div>

          {/* Name */}
          <h4 className="font-semibold text-xs text-center line-clamp-1">{badge.name}</h4>

          {/* XP */}
          <p className="text-[10px] text-primary text-center mt-1">+{badge.xp_reward} XP</p>
        </motion.div>
      ))}
    </SafariCarousel>
  );
};
