import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ContentCard, QuizCard as QuizCardType, UserProgress } from '@/types/content';
import { FactCard } from './FactCard';
import { QuizCard } from './QuizCard';
import { generateContent } from '@/data/educationalContent';

interface ScrollContainerProps {
  onProgressUpdate: (progress: UserProgress) => void;
  onCardsUntilQuizUpdate: (count: number) => void;
}

export const ScrollContainer = ({ onProgressUpdate, onCardsUntilQuizUpdate }: ScrollContainerProps) => {
  const [cards] = useState<ContentCard[]>(() => generateContent());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState<UserProgress>({
    cardsViewed: 0,
    correctAnswers: 0,
    totalQuizzes: 0,
    streak: 0,
  });
  const [factsSinceQuiz, setFactsSinceQuiz] = useState(0);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const isScrolling = useRef(false);

  const scrollToCard = useCallback((index: number) => {
    if (index < 0 || index >= cards.length) return;
    setCurrentIndex(index);
  }, [cards.length]);

  const handleScroll = useCallback((direction: 'up' | 'down') => {
    if (isScrolling.current) return;
    
    isScrolling.current = true;
    
    const newIndex = direction === 'down' 
      ? Math.min(currentIndex + 1, cards.length - 1)
      : Math.max(currentIndex - 1, 0);
    
    if (newIndex !== currentIndex) {
      scrollToCard(newIndex);
      
      const currentCard = cards[newIndex];
      if (direction === 'down' && currentCard.type === 'fact') {
        setProgress(prev => {
          const updated = { ...prev, cardsViewed: prev.cardsViewed + 1 };
          onProgressUpdate(updated);
          return updated;
        });
        setFactsSinceQuiz(prev => {
          const newCount = prev + 1;
          onCardsUntilQuizUpdate(10 - (newCount % 10));
          return newCount;
        });
      }
    }
    
    setTimeout(() => {
      isScrolling.current = false;
    }, 500);
  }, [currentIndex, cards, scrollToCard, onProgressUpdate, onCardsUntilQuizUpdate]);

  const handleQuizAnswer = useCallback((correct: boolean) => {
    setProgress(prev => {
      const updated = {
        ...prev,
        correctAnswers: correct ? prev.correctAnswers + 1 : prev.correctAnswers,
        totalQuizzes: prev.totalQuizzes + 1,
        streak: correct ? prev.streak + 1 : 0,
      };
      onProgressUpdate(updated);
      return updated;
    });
    setFactsSinceQuiz(0);
    onCardsUntilQuizUpdate(10);
    
    // Auto-advance after quiz
    setTimeout(() => {
      handleScroll('down');
    }, 2500);
  }, [handleScroll, onProgressUpdate, onCardsUntilQuizUpdate]);

  // Wheel event handler
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let lastScrollTime = 0;
    const scrollThreshold = 800;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      
      const now = Date.now();
      if (now - lastScrollTime < scrollThreshold) return;
      lastScrollTime = now;
      
      if (Math.abs(e.deltaY) > 10) {
        handleScroll(e.deltaY > 0 ? 'down' : 'up');
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [handleScroll]);

  // Touch events for mobile
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let touchStartY = 0;
    let touchEndY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      touchEndY = e.changedTouches[0].clientY;
      const diff = touchStartY - touchEndY;
      
      if (Math.abs(diff) > 50) {
        handleScroll(diff > 0 ? 'down' : 'up');
      }
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleScroll]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        handleScroll('down');
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        handleScroll('up');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleScroll]);

  const currentCard = cards[currentIndex];

  return (
    <div
      ref={containerRef}
      className="w-full h-screen overflow-hidden bg-background hide-scrollbar"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          className="w-full h-full"
        >
          {currentCard.type === 'quiz' ? (
            <QuizCard
              card={currentCard as QuizCardType}
              onAnswer={handleQuizAnswer}
              index={currentIndex}
            />
          ) : (
            <FactCard card={currentCard} index={currentIndex} />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation Dots */}
      <div className="fixed right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-20">
        {cards.slice(Math.max(0, currentIndex - 2), Math.min(cards.length, currentIndex + 3)).map((_, idx) => {
          const actualIndex = Math.max(0, currentIndex - 2) + idx;
          return (
            <motion.button
              key={actualIndex}
              onClick={() => scrollToCard(actualIndex)}
              className={`w-2 h-2 rounded-full transition-all ${
                actualIndex === currentIndex 
                  ? 'bg-primary w-2 h-6' 
                  : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
              }`}
              whileHover={{ scale: 1.2 }}
              layout
            />
          );
        })}
      </div>
    </div>
  );
};
