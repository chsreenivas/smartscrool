import { useState } from 'react';
import { motion } from 'framer-motion';
import { ThemePicker } from '@/components/ThemePicker';
import { ProgressBar } from '@/components/ProgressBar';
import { ScrollContainer } from '@/components/ScrollContainer';
import { useTheme } from '@/hooks/useTheme';
import { UserProgress } from '@/types/content';
import { Brain } from 'lucide-react';

const Index = () => {
  const { theme, setTheme } = useTheme();
  const [progress, setProgress] = useState<UserProgress>({
    cardsViewed: 0,
    correctAnswers: 0,
    totalQuizzes: 0,
    streak: 0,
  });
  const [cardsUntilQuiz, setCardsUntilQuiz] = useState(10);

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      {/* Fixed Header */}
      <motion.header
        className="fixed top-0 left-0 right-0 z-30 px-4 py-3 flex items-center justify-between bg-background/80 backdrop-blur-md border-b border-border/50"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Logo */}
        <motion.div
          className="flex items-center gap-2"
          whileHover={{ scale: 1.02 }}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
            <Brain className="w-6 h-6 text-primary-foreground" />
          </div>
          <div className="hidden sm:block">
            <h1 className="font-display font-bold text-lg text-gradient-primary">BrainScroll</h1>
            <p className="text-xs text-muted-foreground">Learn while you scroll</p>
          </div>
        </motion.div>

        {/* Progress */}
        <div className="hidden md:block">
          <ProgressBar progress={progress} cardsUntilQuiz={cardsUntilQuiz} />
        </div>

        {/* Theme Picker */}
        <ThemePicker currentTheme={theme} onThemeChange={setTheme} />
      </motion.header>

      {/* Mobile Progress Bar */}
      <motion.div
        className="fixed bottom-0 left-0 right-0 z-30 px-4 py-3 bg-background/80 backdrop-blur-md border-t border-border/50 md:hidden"
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <ProgressBar progress={progress} cardsUntilQuiz={cardsUntilQuiz} />
      </motion.div>

      {/* Main Scroll Container */}
      <main className="pt-16 pb-16 md:pb-0">
        <ScrollContainer
          onProgressUpdate={setProgress}
          onCardsUntilQuizUpdate={setCardsUntilQuiz}
        />
      </main>

      {/* Background Decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <motion.div
          className="absolute top-1/4 -left-32 w-64 h-64 rounded-full bg-primary/10 blur-3xl"
          animate={{
            x: [0, 50, 0],
            y: [0, 30, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full bg-accent/10 blur-3xl"
          animate={{
            x: [0, -30, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>
    </div>
  );
};

export default Index;
