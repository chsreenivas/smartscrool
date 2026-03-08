import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Search, User, Upload, Flame, Zap, X, Brain, Users, Target, BookOpen, Sparkles, Trophy } from 'lucide-react';
import { VideoShort } from '@/components/VideoShort';
import { useShorts } from '@/hooks/useShorts';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/contexts/AuthContext';
import { useQuizCheckpoint } from '@/hooks/useQuizCheckpoint';
import { useStarterFeed } from '@/hooks/useStarterFeed';
import { useDailyGoals } from '@/hooks/useDailyGoals';
import { QuizCheckpointModal } from '@/components/QuizCheckpointModal';
import { StarterFeedBanner } from '@/components/StarterFeedBanner';
import { DailyGoalCard } from '@/components/DailyGoalCard';
import { SearchFilters } from '@/components/SearchFilters';
import { TopicRecommendations } from '@/components/TopicRecommendations';
import { AchievementsModal } from '@/components/AchievementsModal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const categories = ['All', 'Math', 'Science', 'History', 'Psychology', 'Money', 'Technology', 'ELA', 'SAT Prep', 'Music', 'Philosophy'];

const Feed = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showGoals, setShowGoals] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'popular' | 'newest' | 'relevant'>('newest');
  const containerRef = useRef<HTMLDivElement>(null);
  const isScrolling = useRef(false);

  const { shorts, loading, toggleLike, recordView } = useShorts(selectedCategory, searchQuery, selectedDifficulty, sortBy);
  const { profile, addXP } = useProfile();
  const { isNewUser, starterShorts, loading: starterLoading, markAsNotNew } = useStarterFeed();
  const { goals, incrementProgress } = useDailyGoals();
  const { 
    shouldShowQuiz, 
    checkpointQuiz, 
    videosUntilQuiz,
    recordVideoViewed, 
    completeCheckpoint 
  } = useQuizCheckpoint();

  const displayShorts = isNewUser && starterShorts.length > 0 ? starterShorts : shorts;

  useEffect(() => {
    if (isNewUser && currentIndex >= starterShorts.length - 1 && starterShorts.length > 0) {
      markAsNotNew();
    }
  }, [currentIndex, isNewUser, starterShorts.length, markAsNotNew]);

  const scrollToIndex = (index: number) => {
    if (containerRef.current && index >= 0 && index < displayShorts.length) {
      containerRef.current.scrollTo({
        top: index * window.innerHeight,
        behavior: 'smooth',
      });
      setCurrentIndex(index);
    }
  };

  const handleScroll = useCallback((direction: 'up' | 'down') => {
    if (isScrolling.current) return;
    isScrolling.current = true;

    const newIndex = direction === 'down' 
      ? Math.min(currentIndex + 1, displayShorts.length - 1)
      : Math.max(currentIndex - 1, 0);

    scrollToIndex(newIndex);
    setTimeout(() => { isScrolling.current = false; }, 500);
  }, [currentIndex, displayShorts.length]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let touchStartY = 0;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (Math.abs(e.deltaY) > 30) {
        handleScroll(e.deltaY > 0 ? 'down' : 'up');
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const touchEndY = e.changedTouches[0].clientY;
      const diff = touchStartY - touchEndY;
      if (Math.abs(diff) > 50) {
        handleScroll(diff > 0 ? 'down' : 'up');
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        handleScroll('down');
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        handleScroll('up');
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('touchstart', handleTouchStart);
    container.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleScroll]);

  const handleView = async (shortId: string) => {
    const xp = await recordView(shortId);
    if (xp > 0) {
      addXP(xp);
      recordVideoViewed();
      incrementProgress('videos', 1);
    }
    return xp;
  };

  const handleCheckpointComplete = (isCorrect: boolean, xpEarned: number) => {
    if (isCorrect) {
      addXP(xpEarned);
      incrementProgress('quizzes', 1);
      toast.success(`Checkpoint passed! +${xpEarned} XP`);
    }
    completeCheckpoint();
  };

  if (loading || authLoading || starterLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      {/* Header */}
      <motion.header
        className="fixed top-0 left-0 right-0 z-50 px-4 py-3 flex items-center justify-between bg-gradient-to-b from-background/90 to-transparent backdrop-blur-sm"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <button 
          onClick={() => navigate('/feed')}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
            <Brain className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-foreground text-lg">Smart Scroll</span>
        </button>

        {/* Stats */}
        <div className="flex items-center gap-3">
          {profile && (
            <>
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-muted/50 backdrop-blur-sm">
                <Flame className="w-4 h-4 text-orange-400" />
                <span className="text-foreground text-sm font-medium">{profile.streak}</span>
              </div>
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-muted/50 backdrop-blur-sm">
                <Zap className="w-4 h-4 text-yellow-400" />
                <span className="text-foreground text-sm font-medium">{profile.xp}</span>
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setShowAchievements(true); }}
            className="w-10 h-10 rounded-full bg-muted/50 backdrop-blur-sm flex items-center justify-center hover-scale-subtle"
          >
            <Trophy className="w-5 h-5 text-foreground" />
          </button>
          <button
            onClick={() => { setShowRecommendations(!showRecommendations); setShowGoals(false); setShowSearch(false); }}
            className="w-10 h-10 rounded-full bg-muted/50 backdrop-blur-sm flex items-center justify-center hover-scale-subtle"
          >
            <Sparkles className={`w-5 h-5 ${showRecommendations ? 'text-primary' : 'text-foreground'}`} />
          </button>
          <button
            onClick={() => { setShowGoals(!showGoals); setShowRecommendations(false); setShowSearch(false); }}
            className="w-10 h-10 rounded-full bg-muted/50 backdrop-blur-sm flex items-center justify-center hover-scale-subtle"
          >
            <Target className={`w-5 h-5 ${showGoals ? 'text-primary' : 'text-foreground'}`} />
          </button>
          <button
            onClick={() => { setShowSearch(!showSearch); setShowGoals(false); setShowRecommendations(false); }}
            className="w-10 h-10 rounded-full bg-muted/50 backdrop-blur-sm flex items-center justify-center hover-scale-subtle"
          >
            {showSearch ? <X className="w-5 h-5 text-foreground" /> : <Search className="w-5 h-5 text-foreground" />}
          </button>
          <button onClick={() => navigate('/')} className="w-10 h-10 rounded-full bg-muted/50 backdrop-blur-sm flex items-center justify-center hover-scale-subtle">
            <BookOpen className="w-5 h-5 text-foreground" />
          </button>
          <button onClick={() => navigate('/social')} className="w-10 h-10 rounded-full bg-muted/50 backdrop-blur-sm flex items-center justify-center hover-scale-subtle">
            <Users className="w-5 h-5 text-foreground" />
          </button>
          <button onClick={() => navigate('/upload')} className="w-10 h-10 rounded-full bg-muted/50 backdrop-blur-sm flex items-center justify-center hover-scale-subtle">
            <Upload className="w-5 h-5 text-foreground" />
          </button>
          <button onClick={() => navigate('/profile')} className="w-10 h-10 rounded-full bg-muted/50 backdrop-blur-sm flex items-center justify-center hover-scale-subtle">
            <User className="w-5 h-5 text-foreground" />
          </button>
        </div>
      </motion.header>

      {/* Starter Feed Banner */}
      <AnimatePresence>
        <StarterFeedBanner isVisible={isNewUser === true && currentIndex < 3} />
      </AnimatePresence>

      {/* Daily Goals Dropdown */}
      <AnimatePresence>
        {showGoals && goals.length > 0 && (
          <motion.div className="fixed top-16 left-4 right-4 z-40 space-y-2" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <div className="p-3 rounded-xl bg-card/90 backdrop-blur-md border border-border/50">
              <h3 className="text-sm font-semibold text-foreground mb-2">Today's Goals</h3>
              <div className="space-y-2">
                {goals.map((goal) => (
                  <DailyGoalCard key={goal.id} goalType={goal.goal_type} subject={goal.subject} target={goal.target} progress={goal.progress} completed={goal.completed} />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Topic Recommendations Dropdown */}
      <AnimatePresence>
        {showRecommendations && (
          <motion.div className="fixed top-16 left-4 right-4 z-40" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <TopicRecommendations />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Bar */}
      {showSearch && (
        <motion.div className="fixed top-16 left-0 right-0 z-40 px-4 py-2 space-y-2" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <Input
            placeholder="Search educational shorts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-card/90 backdrop-blur-md border-border/50 text-foreground placeholder:text-muted-foreground"
          />
          <SearchFilters selectedDifficulty={selectedDifficulty} onDifficultyChange={setSelectedDifficulty} sortBy={sortBy} onSortChange={setSortBy} />
        </motion.div>
      )}

      {/* Category Pills */}
      <motion.div
        className={`fixed ${showSearch ? 'top-36' : (showGoals && goals.length > 0) || showRecommendations ? 'top-44' : 'top-16'} left-0 right-0 z-40 px-4 py-2 flex gap-2 overflow-x-auto hide-scrollbar transition-all duration-300`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              selectedCategory === category ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-foreground backdrop-blur-sm hover:bg-muted'
            }`}
          >
            {category}
          </button>
        ))}
      </motion.div>

      {/* Video Feed */}
      <div ref={containerRef} className="h-screen overflow-hidden">
        {displayShorts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-foreground">
            <Brain className="w-16 h-16 mb-4 opacity-50" />
            <h2 className="text-xl font-bold mb-2">No shorts yet</h2>
            <p className="text-muted-foreground mb-4">Be the first to upload educational content!</p>
            <Button onClick={() => navigate('/upload')} variant="outline">Upload a Short</Button>
          </div>
        ) : (
          displayShorts.map((short, index) => (
            <div key={short.id} className="h-screen w-full flex-shrink-0">
              <VideoShort
                short={{ ...short, isLiked: 'isLiked' in short ? short.isLiked : false }}
                isActive={index === currentIndex}
                onLike={() => toggleLike(short.id)}
                onView={() => handleView(short.id)}
                xpEarned={5}
                showStarterBadge={isNewUser === true && index < starterShorts.length}
              />
            </div>
          ))
        )}
      </div>

      {/* Progress Dots */}
      {displayShorts.length > 0 && (
        <div className="fixed right-2 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-1">
          {displayShorts.slice(0, 10).map((_, index) => (
            <button
              key={index}
              onClick={() => scrollToIndex(index)}
              className={`w-1.5 h-1.5 rounded-full transition-all ${index === currentIndex ? 'bg-primary h-4' : 'bg-muted-foreground/30'}`}
            />
          ))}
        </div>
      )}

      {/* Videos until quiz indicator */}
      {videosUntilQuiz <= 5 && videosUntilQuiz > 0 && (
        <motion.div
          className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-full bg-primary/80 backdrop-blur-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span className="text-primary-foreground text-sm font-medium">
            📚 Quiz checkpoint in {videosUntilQuiz} video{videosUntilQuiz !== 1 ? 's' : ''}!
          </span>
        </motion.div>
      )}

      {/* Quiz Checkpoint Modal */}
      <QuizCheckpointModal isOpen={shouldShowQuiz} quiz={checkpointQuiz} onComplete={handleCheckpointComplete} videosWatched={25} />

      {/* Achievements Modal */}
      <AchievementsModal isOpen={showAchievements} onClose={() => setShowAchievements(false)} />
    </div>
  );
};

export default Feed;
