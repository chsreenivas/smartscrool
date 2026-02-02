import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, RefreshCw } from 'lucide-react';
import { useTopicRecommendations } from '@/hooks/useTopicRecommendations';
import { Button } from '@/components/ui/button';

const topicEmojis: Record<string, string> = {
  math: '🔢',
  science: '🔬',
  history: '📜',
  psychology: '🧠',
  ela: '📚',
  money: '💰',
  technology: '💻',
  'sat-prep': '📝',
  music: '🎵',
  philosophy: '💭',
};

export const TopicRecommendations = () => {
  const navigate = useNavigate();
  const { recommendations, loading, refresh } = useTopicRecommendations();

  if (loading) {
    return (
      <div className="bg-card rounded-2xl p-4 border border-border/50">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-primary animate-pulse" />
          <span className="font-semibold text-sm">Finding topics for you...</span>
        </div>
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 flex-1 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl p-4 border border-primary/20"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <span className="font-display font-semibold text-sm">Recommended for You</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={refresh}
          className="h-7 px-2"
        >
          <RefreshCw className="w-3 h-3" />
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {recommendations.slice(0, 3).map((rec, index) => (
          <motion.button
            key={rec.slug}
            onClick={() => navigate(`/topic/${rec.slug}`)}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="p-3 rounded-xl bg-card border border-border/50 hover-lift hover-glow text-left group"
          >
            <div className="text-2xl mb-1">
              {topicEmojis[rec.slug] || '📖'}
            </div>
            <h4 className="font-semibold text-xs line-clamp-1">{rec.topic}</h4>
            <p className="text-[10px] text-muted-foreground line-clamp-2 mt-0.5">
              {rec.reason}
            </p>
            <ArrowRight className="w-3 h-3 text-primary mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};
