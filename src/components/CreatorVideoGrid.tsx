import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Play, Eye, Heart } from 'lucide-react';

interface Video {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  thumbnail_url: string | null;
  category: string;
  subtopic: string | null;
  views_count: number;
  likes_count: number;
  created_at: string;
}

interface CreatorVideoGridProps {
  videos: Video[];
  layout?: 'grid' | 'carousel';
}

export const CreatorVideoGrid = ({ videos, layout = 'grid' }: CreatorVideoGridProps) => {
  const navigate = useNavigate();

  const containerClass = layout === 'carousel' 
    ? 'safari-carousel' 
    : 'grid grid-cols-2 gap-3';

  const itemClass = layout === 'carousel'
    ? 'w-36 flex-shrink-0'
    : '';

  return (
    <div className={containerClass}>
      {videos.map((video, index) => (
        <motion.button
          key={video.id}
          onClick={() => navigate(`/feed?video=${video.id}`)}
          className={`relative aspect-[9/16] rounded-xl overflow-hidden bg-muted group cursor-pointer ${itemClass}`}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.05 }}
          whileHover={{ 
            scale: 1.05, 
            y: -4,
            boxShadow: '0 10px 40px -10px hsl(var(--primary) / 0.3)'
          }}
          whileTap={{ scale: 0.98 }}
        >
          {/* Thumbnail or Video Preview */}
          {video.thumbnail_url ? (
            <img
              src={video.thumbnail_url}
              alt={video.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <video
              src={video.video_url}
              className="w-full h-full object-cover"
              muted
              preload="metadata"
            />
          )}

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
            <Play className="w-10 h-10 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>

          {/* Stats */}
          <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
            <p className="text-white text-xs font-medium line-clamp-1 mb-1">
              {video.title}
            </p>
            <div className="flex items-center gap-3 text-white/80 text-xs">
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {video.views_count}
              </span>
              <span className="flex items-center gap-1">
                <Heart className="w-3 h-3" />
                {video.likes_count}
              </span>
            </div>
          </div>

          {/* Category Badge */}
          <div className="absolute top-2 left-2">
            <span className="px-2 py-0.5 rounded-full bg-black/50 text-white text-xs backdrop-blur-sm">
              {video.category}
            </span>
          </div>
        </motion.button>
      ))}
    </div>
  );
};
