import { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Search, User, Upload, Flame, Zap, X, Brain, Users } from 'lucide-react';
import { VideoShort } from '@/components/VideoShort';
import { useShorts } from '@/hooks/useShorts';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const categories = ['All', 'Science', 'History', 'Psychology', 'Money', 'Technology'];

const Feed = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isScrolling = useRef(false);

  const { shorts, loading, toggleLike, recordView } = useShorts(selectedCategory, searchQuery);
  const { profile, addXP } = useProfile();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/');
    }
  }, [user, authLoading, navigate]);

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
    }
    return xp;
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-black overflow-hidden">
      {/* Header */}
      <motion.header
        className="fixed top-0 left-0 right-0 z-50 px-4 py-3 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
            <Brain className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-white text-lg">BrainScroll</span>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3">
          {profile && (
            <>
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/10 backdrop-blur-sm">
                <Flame className="w-4 h-4 text-orange-400" />
                <span className="text-white text-sm font-medium">{profile.streak}</span>
              </div>
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/10 backdrop-blur-sm">
                <Zap className="w-4 h-4 text-yellow-400" />
                <span className="text-white text-sm font-medium">{profile.xp}</span>
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center"
          >
            {showSearch ? <X className="w-5 h-5 text-white" /> : <Search className="w-5 h-5 text-white" />}
          </button>
          <button
            onClick={() => navigate('/social')}
            className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center"
          >
            <Users className="w-5 h-5 text-white" />
          </button>
          <button
            onClick={() => navigate('/upload')}
            className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center"
          >
            <Upload className="w-5 h-5 text-white" />
          </button>
          <button
            onClick={() => navigate('/profile')}
            className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center"
          >
            <User className="w-5 h-5 text-white" />
          </button>
        </div>
      </motion.header>

      {/* Search Bar */}
      {showSearch && (
        <motion.div
          className="fixed top-16 left-0 right-0 z-40 px-4 py-2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Input
            placeholder="Search educational shorts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/10 backdrop-blur-md border-white/20 text-white placeholder:text-white/60"
          />
        </motion.div>
      )}

      {/* Category Pills */}
      <motion.div
        className={`fixed ${showSearch ? 'top-28' : 'top-16'} left-0 right-0 z-40 px-4 py-2 flex gap-2 overflow-x-auto hide-scrollbar`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              selectedCategory === category
                ? 'bg-primary text-primary-foreground'
                : 'bg-white/10 text-white backdrop-blur-sm hover:bg-white/20'
            }`}
          >
            {category}
          </button>
        ))}
      </motion.div>

      {/* Video Feed */}
      <div
        ref={containerRef}
        className="h-screen overflow-hidden"
      >
        {shorts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-white">
            <Brain className="w-16 h-16 mb-4 opacity-50" />
            <h2 className="text-xl font-bold mb-2">No shorts yet</h2>
            <p className="text-white/60 mb-4">Be the first to upload educational content!</p>
            <Button onClick={() => navigate('/upload')} variant="outline" className="text-white border-white/30">
              Upload a Short
            </Button>
          </div>
        ) : (
          shorts.map((short, index) => (
            <div key={short.id} className="h-screen w-full flex-shrink-0">
              <VideoShort
                short={short}
                isActive={index === currentIndex}
                onLike={() => toggleLike(short.id)}
                onView={() => handleView(short.id)}
                xpEarned={5}
              />
            </div>
          ))
        )}
      </div>

      {/* Progress Dots */}
      {shorts.length > 0 && (
        <div className="fixed right-2 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-1">
          {shorts.slice(0, 10).map((_, index) => (
            <button
              key={index}
              onClick={() => scrollToIndex(index)}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                index === currentIndex ? 'bg-primary h-4' : 'bg-white/30'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Feed;
