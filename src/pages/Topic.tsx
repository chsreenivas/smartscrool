import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Brain, Search, X } from 'lucide-react';
import { VideoShort } from '@/components/VideoShort';
import { useShorts } from '@/hooks/useShorts';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/contexts/AuthContext';
import { useTopicQuizCheckpoint } from '@/hooks/useTopicQuizCheckpoint';
import { QuizCheckpointModal } from '@/components/QuizCheckpointModal';
import { SearchFilters } from '@/components/SearchFilters';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const topicInfo: Record<string, { title: string; description: string; icon: string }> = {
  'math': { 
    title: 'Math', 
    description: 'From basics to calculus - build your number confidence',
    icon: '🔢'
  },
  'science': { 
    title: 'Science', 
    description: 'Explore physics, chemistry, biology and more',
    icon: '🔬'
  },
  'history': { 
    title: 'Early American History', 
    description: 'Discover the stories that shaped America',
    icon: '📜'
  },
  'psychology': { 
    title: 'Psychology', 
    description: 'Understand the mind and human behavior',
    icon: '🧠'
  },
  'ela': { 
    title: 'ELA', 
    description: 'Reading, writing, and language arts mastery',
    icon: '📚'
  },
  'money': { 
    title: 'Money & Personal Finance', 
    description: 'Learn to manage money like a pro',
    icon: '💰'
  },
  'technology': { 
    title: 'Technology', 
    description: 'Code, computers, and digital literacy',
    icon: '💻'
  },
  'sat-prep': { 
    title: 'SAT Prep', 
    description: 'Ace your SAT with focused practice',
    icon: '📝'
  },
  'music': { 
    title: 'Music', 
    description: 'Guitar, piano, and music fundamentals',
    icon: '🎵'
  },
  'philosophy': { 
    title: 'Philosophy', 
    description: 'Big ideas made simple and relatable',
    icon: '💭'
  },
};

const Topic = () => {
  const navigate = useNavigate();
  const { topicSlug } = useParams<{ topicSlug: string }>();
  const { user, loading: authLoading } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'popular' | 'newest' | 'relevant'>('popular');
  const containerRef = useRef<HTMLDivElement>(null);
  const isScrolling = useRef(false);

  const topic = topicInfo[topicSlug || ''];
  const categoryName = topic?.title || topicSlug || 'All';
  
  const { shorts, loading, toggleLike, recordView } = useShorts(categoryName, searchQuery);
  const { profile, addXP } = useProfile();
  const { 
    shouldShowQuiz, 
    checkpointQuiz, 
    videosUntilQuiz,
    recordVideoViewed, 
    completeCheckpoint 
  } = useTopicQuizCheckpoint(categoryName);

  // No manual redirect needed - ProtectedRoute handles auth

  const scrollToIndex = (index: number) => {
    if (containerRef.current && index >= 0 && index < shorts.length) {
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
      ? Math.min(currentIndex + 1, shorts.length - 1)
      : Math.max(currentIndex - 1, 0);

    scrollToIndex(newIndex);
    setTimeout(() => { isScrolling.current = false; }, 500);
  }, [currentIndex, shorts.length]);

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

    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('touchstart', handleTouchStart);
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleScroll]);

  const handleView = async (shortId: string) => {
    const xp = await recordView(shortId);
    if (xp > 0) {
      addXP(xp);
      recordVideoViewed();
    }
    return xp;
  };

  const handleCheckpointComplete = (isCorrect: boolean, xpEarned: number) => {
    if (isCorrect) {
      addXP(xpEarned);
      toast.success(`Checkpoint passed! +${xpEarned} XP`);
    }
    completeCheckpoint();
  };

  if (!topic) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Topic not found</h1>
          <Button onClick={() => navigate('/topics')}>Browse Topics</Button>
        </div>
      </div>
    );
  }

  if (loading || authLoading) {
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
      >
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/topics')} className="p-2 -ml-2">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{topic.icon}</span>
            <div>
              <h1 className="font-display font-bold text-foreground">{topic.title}</h1>
              <p className="text-xs text-muted-foreground">{shorts.length} videos</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowSearch(!showSearch)}
          className="w-10 h-10 rounded-full bg-muted/50 backdrop-blur-sm flex items-center justify-center"
        >
          {showSearch ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
        </button>
      </motion.header>

      {/* Search */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            className="fixed top-16 left-0 right-0 z-40 px-4 py-2 space-y-2"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Input
              placeholder={`Search ${topic.title} videos...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-card/90 backdrop-blur-md border-border/50"
            />
            <SearchFilters
              selectedDifficulty={selectedDifficulty}
              onDifficultyChange={setSelectedDifficulty}
              sortBy={sortBy}
              onSortChange={setSortBy}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video Feed */}
      <div ref={containerRef} className="h-screen overflow-hidden">
        {shorts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-foreground pt-20">
            <span className="text-6xl mb-4">{topic.icon}</span>
            <h2 className="text-xl font-bold mb-2">No videos yet</h2>
            <p className="text-muted-foreground mb-4 text-center px-8">{topic.description}</p>
            <Button onClick={() => navigate('/upload')} variant="outline">
              Be the first to upload
            </Button>
          </div>
        ) : (
          shorts.map((short, index) => (
            <div key={short.id} className="h-screen w-full flex-shrink-0">
              <VideoShort
                short={{ ...short, isLiked: 'isLiked' in short ? short.isLiked : false }}
                isActive={index === currentIndex}
                onLike={() => toggleLike(short.id)}
                onView={() => handleView(short.id)}
                xpEarned={5}
              />
            </div>
          ))
        )}
      </div>

      {/* Progress indicator */}
      {shorts.length > 0 && (
        <div className="fixed right-2 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-1">
          {shorts.slice(0, 10).map((_, index) => (
            <button
              key={index}
              onClick={() => scrollToIndex(index)}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                index === currentIndex ? 'bg-primary h-4' : 'bg-muted-foreground/30'
              }`}
            />
          ))}
        </div>
      )}

      {/* Quiz countdown */}
      {videosUntilQuiz <= 5 && videosUntilQuiz > 0 && (
        <motion.div
          className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-full bg-primary/80 backdrop-blur-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span className="text-primary-foreground text-sm font-medium">
            📚 {topic.title} quiz in {videosUntilQuiz} video{videosUntilQuiz !== 1 ? 's' : ''}!
          </span>
        </motion.div>
      )}

      {/* Quiz Modal */}
      <QuizCheckpointModal
        isOpen={shouldShowQuiz}
        quiz={checkpointQuiz}
        onComplete={handleCheckpointComplete}
        videosWatched={25}
      />
    </div>
  );
};

export default Topic;
