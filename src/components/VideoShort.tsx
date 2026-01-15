import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Share2, Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { Short } from '@/hooks/useShorts';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

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
  const { user } = useAuth();
  const hasRecordedView = useRef(false);

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

  const handleShare = async () => {
    try {
      await navigator.share({
        title: short.title,
        text: short.description || '',
        url: window.location.href,
      });
    } catch {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
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
      {showXP && (
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          initial={{ opacity: 0, scale: 0.5, y: 0 }}
          animate={{ opacity: [0, 1, 1, 0], scale: [0.5, 1.2, 1, 1], y: [0, -50] }}
          transition={{ duration: 2 }}
        >
          <div className="text-4xl font-bold text-yellow-400 drop-shadow-lg">
            +{xpEarned} XP
          </div>
        </motion.div>
      )}

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
        </div>
      </div>

      {/* Right Side Actions */}
      <div className="absolute right-4 bottom-32 flex flex-col items-center gap-6">
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

        {/* Share */}
        <motion.button
          onClick={handleShare}
          whileTap={{ scale: 0.9 }}
          className="flex flex-col items-center"
        >
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Share2 className="w-6 h-6 text-white" />
          </div>
          <span className="text-white text-xs mt-1 font-medium">Share</span>
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
      </div>

      {/* Swipe hint */}
      <motion.div
        className="absolute bottom-6 left-1/2 -translate-x-1/2"
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <span className="text-white/60 text-sm">Swipe up for more</span>
      </motion.div>
    </div>
  );
};
