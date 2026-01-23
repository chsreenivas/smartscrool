import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Play, Volume2, VolumeX, HelpCircle, MessageSquare, Send, Flag } from 'lucide-react';
import { Short } from '@/hooks/useShorts';
import { useAuth } from '@/contexts/AuthContext';
import { useQuizzes, Quiz } from '@/hooks/useQuizzes';
import { toast } from 'sonner';
import { QuizOverlay } from './QuizOverlay';
import { SharePanel } from './SharePanel';
import { AITutorChat } from './AITutorChat';
import { ReportModal } from './ReportModal';

interface VideoShortProps {
  short: Short;
  isActive: boolean;
  onLike: () => void;
  onView: () => void;
  xpEarned?: number;
}

export const VideoShort = ({ short, isActive, onLike, onView, xpEarned }: VideoShortProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showXP, setShowXP] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showTutor, setShowTutor] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [hasAttemptedQuiz, setHasAttemptedQuiz] = useState(false);
  const { user } = useAuth();
  const { getQuizForShort, hasAttemptedQuiz: checkAttempted } = useQuizzes();
  const hasRecordedView = useRef(false);

  useEffect(() => {
    const loadQuiz = async () => {
      const quizData = await getQuizForShort(short.id);
      setQuiz(quizData);
      if (quizData && user) {
        const attempted = await checkAttempted(quizData.id);
        setHasAttemptedQuiz(attempted);
      }
    };
    loadQuiz();
  }, [short.id, user]);

  useEffect(() => {
    if (isActive && videoRef.current) {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
      
      // Record view after 3 seconds
      if (!hasRecordedView.current) {
        const timer = setTimeout(() => {
          onView();
          hasRecordedView.current = true;
          if (xpEarned && xpEarned > 0) {
            setShowXP(true);
            setTimeout(() => setShowXP(false), 2000);
          }
        }, 3000);
        return () => clearTimeout(timer);
      }
    } else if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [isActive, onView, xpEarned]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleLike = () => {
    if (!user) {
      toast.error('Please sign in to like videos');
      return;
    }
    onLike();
  };

  const handleShare = () => {
    if (!user) {
      // Fallback to native share for non-authenticated users
      navigator.share?.({
        title: short.title,
        text: short.description || '',
        url: window.location.href,
      }).catch(() => {
        navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard!');
      });
      return;
    }
    setShowShare(true);
  };

  const handleQuizClick = () => {
    if (!user) {
      toast.error('Please sign in to take quizzes');
      return;
    }
    if (!quiz) {
      toast.info('No quiz available for this video yet');
      return;
    }
    if (hasAttemptedQuiz) {
      toast.info('You already completed this quiz!');
      return;
    }
    setShowQuiz(true);
  };

  const handleTutorClick = () => {
    if (!user) {
      toast.error('Please sign in to use AI tutor');
      return;
    }
    setShowTutor(true);
  };

  const handleQuizComplete = (isCorrect: boolean, earnedXP: number) => {
    setHasAttemptedQuiz(true);
    if (isCorrect) {
      toast.success(`Correct! +${earnedXP} XP`);
    } else {
      toast.error('Incorrect. Keep learning!');
    }
  };

  const handleReport = () => {
    if (!user) {
      toast.error('Please sign in to report content');
      return;
    }
    setShowReport(true);
  };

  return (
    <div className="relative w-full h-full bg-black">
      {/* Video */}
      <video
        ref={videoRef}
        src={short.video_url}
        className="w-full h-full object-cover"
        loop
        muted={isMuted}
        playsInline
        onClick={togglePlay}
        poster={short.thumbnail_url || undefined}
      />

      {/* Play/Pause Overlay */}
      {!isPlaying && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center bg-black/30"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={togglePlay}
        >
          <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Play className="w-10 h-10 text-white ml-1" />
          </div>
        </motion.div>
      )}

      {/* XP Animation */}
      <AnimatePresence>
        {showXP && (
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            initial={{ opacity: 0, scale: 0.5, y: 0 }}
            animate={{ opacity: [0, 1, 1, 0], scale: [0.5, 1.2, 1, 1], y: [0, -50] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2 }}
          >
            <div className="text-4xl font-bold text-yellow-400 drop-shadow-lg">
              +{xpEarned} XP
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />

      {/* Content Overlay */}
      <div className="absolute bottom-0 left-0 right-16 p-4 pb-24">
        <h2 className="text-xl font-bold text-white mb-2 drop-shadow-lg">
          {short.title}
        </h2>
        {short.description && (
          <p className="text-white/90 text-sm drop-shadow-lg line-clamp-2">
            {short.description}
          </p>
        )}
        <div className="flex items-center gap-2 mt-2">
          <span className="px-3 py-1 rounded-full bg-white/20 text-white text-xs font-medium backdrop-blur-sm">
            {short.category}
          </span>
          {quiz && !hasAttemptedQuiz && (
            <span className="px-3 py-1 rounded-full bg-primary/80 text-primary-foreground text-xs font-medium backdrop-blur-sm animate-pulse">
              Quiz Available!
            </span>
          )}
        </div>
      </div>

      {/* Right Side Actions */}
      <div className="absolute right-4 bottom-32 flex flex-col items-center gap-5">
        {/* Like */}
        <motion.button
          onClick={handleLike}
          whileTap={{ scale: 0.9 }}
          className="flex flex-col items-center"
        >
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
            short.isLiked ? 'bg-red-500' : 'bg-white/20 backdrop-blur-sm'
          }`}>
            <Heart className={`w-6 h-6 ${short.isLiked ? 'text-white fill-white' : 'text-white'}`} />
          </div>
          <span className="text-white text-xs mt-1 font-medium">{short.likes_count}</span>
        </motion.button>

        {/* Quiz */}
        <motion.button
          onClick={handleQuizClick}
          whileTap={{ scale: 0.9 }}
          className="flex flex-col items-center"
        >
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
            quiz && !hasAttemptedQuiz 
              ? 'bg-primary/80 backdrop-blur-sm' 
              : hasAttemptedQuiz 
                ? 'bg-green-500/80 backdrop-blur-sm' 
                : 'bg-white/20 backdrop-blur-sm'
          }`}>
            <HelpCircle className="w-6 h-6 text-white" />
          </div>
          <span className="text-white text-xs mt-1 font-medium">
            {hasAttemptedQuiz ? 'Done' : 'Quiz'}
          </span>
        </motion.button>

        {/* AI Tutor */}
        <motion.button
          onClick={handleTutorClick}
          whileTap={{ scale: 0.9 }}
          className="flex flex-col items-center"
        >
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
          <span className="text-white text-xs mt-1 font-medium">Tutor</span>
        </motion.button>

        {/* Share (Private) */}
        <motion.button
          onClick={handleShare}
          whileTap={{ scale: 0.9 }}
          className="flex flex-col items-center"
        >
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Send className="w-6 h-6 text-white" />
          </div>
          <span className="text-white text-xs mt-1 font-medium">Send</span>
        </motion.button>

        {/* Mute/Unmute */}
        <motion.button
          onClick={toggleMute}
          whileTap={{ scale: 0.9 }}
          className="flex flex-col items-center"
        >
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            {isMuted ? (
              <VolumeX className="w-6 h-6 text-white" />
            ) : (
              <Volume2 className="w-6 h-6 text-white" />
            )}
          </div>
          <span className="text-white text-xs mt-1 font-medium">{isMuted ? 'Unmute' : 'Mute'}</span>
        </motion.button>

        {/* Report */}
        <motion.button
          onClick={handleReport}
          whileTap={{ scale: 0.9 }}
          className="flex flex-col items-center"
        >
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Flag className="w-6 h-6 text-white" />
          </div>
          <span className="text-white text-xs mt-1 font-medium">Report</span>
        </motion.button>
      </div>

      {/* Swipe hint */}
      <motion.div
        className="absolute bottom-6 left-1/2 -translate-x-1/2"
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <span className="text-white/60 text-sm">Swipe up for more</span>
      </motion.div>

      {/* Quiz Overlay */}
      {quiz && (
        <QuizOverlay
          isOpen={showQuiz}
          onClose={() => setShowQuiz(false)}
          quiz={quiz}
          onComplete={handleQuizComplete}
        />
      )}

      {/* Share Panel */}
      <SharePanel
        isOpen={showShare}
        onClose={() => setShowShare(false)}
        shortId={short.id}
        shortTitle={short.title}
      />

      {/* AI Tutor Chat */}
      <AITutorChat
        isOpen={showTutor}
        onClose={() => setShowTutor(false)}
        shortTitle={short.title}
        shortDescription={short.description}
        category={short.category}
      />

      {/* Report Modal */}
      <ReportModal
        isOpen={showReport}
        onClose={() => setShowReport(false)}
        shortId={short.id}
        shortTitle={short.title}
      />
    </div>
  );
};
