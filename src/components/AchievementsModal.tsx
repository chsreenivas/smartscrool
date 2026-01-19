import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, Lock, CheckCircle } from 'lucide-react';
import { useAchievements } from '@/hooks/useAchievements';

interface AchievementsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AchievementsModal = ({ isOpen, onClose }: AchievementsModalProps) => {
  const { achievements, userAchievements, loading } = useAchievements();

  const earnedIds = new Set(userAchievements.map(a => a.id));

  const getProgress = (achievement: typeof achievements[0]) => {
    // This would be calculated based on actual user stats
    // For now, return 0 for unearned achievements
    return earnedIds.has(achievement.id) ? 100 : 0;
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
            className="absolute inset-x-4 top-12 bottom-12 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-md bg-card rounded-2xl overflow-hidden shadow-elevated"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
          >
            {/* Header */}
            <div className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-primary" />
                  <h2 className="font-display text-xl font-bold">Achievements</h2>
                </div>
                <button onClick={onClose} className="p-2 -mr-2 hover:bg-secondary rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {userAchievements.length} of {achievements.length} unlocked
              </p>
            </div>

            {/* Progress Overview */}
            <div className="px-4 py-3 bg-primary/10 border-b border-primary/20">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Overall Progress</span>
                <span className="font-bold text-primary">
                  {Math.round((userAchievements.length / achievements.length) * 100)}%
                </span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-primary transition-all duration-500"
                  style={{ width: `${(userAchievements.length / achievements.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Achievements Grid */}
            <div className="overflow-y-auto h-[calc(100%-140px)] p-4">
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {achievements.map((achievement, index) => {
                    const isEarned = earnedIds.has(achievement.id);
                    
                    return (
                      <motion.div
                        key={achievement.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.03 }}
                        className={`relative p-4 rounded-xl border transition-all ${
                          isEarned 
                            ? 'bg-gradient-to-br from-primary/20 to-accent/20 border-primary/50' 
                            : 'bg-card border-border opacity-60'
                        }`}
                      >
                        {/* Status Icon */}
                        <div className="absolute top-2 right-2">
                          {isEarned ? (
                            <CheckCircle className="w-4 h-4 text-success" />
                          ) : (
                            <Lock className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>

                        {/* Icon */}
                        <div className="text-3xl mb-2">{achievement.icon}</div>

                        {/* Name */}
                        <h3 className="font-semibold text-sm mb-1">{achievement.name}</h3>

                        {/* Description */}
                        <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                          {achievement.description}
                        </p>

                        {/* XP Reward */}
                        <div className="text-xs font-medium text-primary">
                          +{achievement.xp_reward} XP
                        </div>

                        {/* Progress Bar (for unearned) */}
                        {!isEarned && (
                          <div className="mt-2 h-1 bg-secondary rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary/50 transition-all"
                              style={{ width: `${getProgress(achievement)}%` }}
                            />
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
