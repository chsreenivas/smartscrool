import { motion } from 'framer-motion';
import { Flame, Brain, CheckCircle } from 'lucide-react';
import { UserProgress } from '@/types/content';

interface ProgressBarProps {
  progress: UserProgress;
  cardsUntilQuiz: number;
}

export const ProgressBar = ({ progress, cardsUntilQuiz }: ProgressBarProps) => {
  const quizProgress = ((10 - cardsUntilQuiz) / 10) * 100;

  return (
    <div className="flex items-center gap-4">
      {/* Streak Counter */}
      <motion.div
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/80 backdrop-blur-sm"
        whileHover={{ scale: 1.05 }}
      >
        <Flame className="w-4 h-4 text-primary" />
        <span className="font-display font-semibold text-sm">{progress.streak}</span>
      </motion.div>

      {/* Cards Viewed */}
      <motion.div
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/80 backdrop-blur-sm"
        whileHover={{ scale: 1.05 }}
      >
        <Brain className="w-4 h-4 text-accent" />
        <span className="font-display font-semibold text-sm">{progress.cardsViewed}</span>
      </motion.div>

      {/* Quiz Progress */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/80 backdrop-blur-sm">
        <CheckCircle className="w-4 h-4 text-success" />
        <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${quizProgress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <span className="font-display font-semibold text-xs text-muted-foreground">
          {cardsUntilQuiz}
        </span>
      </div>
    </div>
  );
};
