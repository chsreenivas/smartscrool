import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, Flame, Zap, Crown, Medal, Users } from 'lucide-react';
import { useLeaderboard, LeaderboardType } from '@/hooks/useLeaderboard';
import { useAuth } from '@/contexts/AuthContext';

interface LeaderboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Leaderboard = ({ isOpen, onClose }: LeaderboardProps) => {
  const [type, setType] = useState<LeaderboardType>('global');
  const { entries, userRank, loading } = useLeaderboard(type);
  const { user } = useAuth();

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5 text-yellow-400" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-300" />;
      case 3:
        return <Medal className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="w-5 h-5 text-muted-foreground text-sm font-bold">#{rank}</span>;
    }
  };

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-500/50';
      case 2:
        return 'bg-gradient-to-r from-gray-300/20 to-gray-400/20 border-gray-400/50';
      case 3:
        return 'bg-gradient-to-r from-amber-600/20 to-orange-600/20 border-amber-600/50';
      default:
        return 'bg-card/50 border-border/50';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-x-4 top-12 bottom-12 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-md bg-card rounded-2xl overflow-hidden shadow-elevated"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
          >
            {/* Header */}
            <div className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-primary" />
                  <h2 className="font-display text-xl font-bold">Leaderboard</h2>
                </div>
                <button onClick={onClose} className="p-2 -mr-2 hover:bg-secondary rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-2">
                {(['global', 'friends', 'weekly'] as LeaderboardType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                      type === t
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                    }`}
                  >
                    {t === 'global' && <Trophy className="w-4 h-4 inline mr-1" />}
                    {t === 'friends' && <Users className="w-4 h-4 inline mr-1" />}
                    {t === 'weekly' && <Flame className="w-4 h-4 inline mr-1" />}
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* User Rank Banner */}
            {userRank && (
              <div className="px-4 py-3 bg-primary/10 border-b border-primary/20">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Your Rank</span>
                  <span className="font-bold text-primary">#{userRank}</span>
                </div>
              </div>
            )}

            {/* List */}
            <div className="overflow-y-auto h-[calc(100%-160px)] p-4 space-y-2">
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : entries.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Trophy className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No entries yet</p>
                </div>
              ) : (
                entries.map((entry, index) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className={`flex items-center gap-3 p-3 rounded-xl border ${getRankStyle(entry.rank)} ${
                      entry.id === user?.id ? 'ring-2 ring-primary' : ''
                    }`}
                  >
                    <div className="w-8 flex justify-center">
                      {getRankIcon(entry.rank)}
                    </div>

                    <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center flex-shrink-0">
                      {entry.avatar_url ? (
                        <img src={entry.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <span className="text-lg font-bold text-primary-foreground">
                          {entry.username?.charAt(0).toUpperCase() || '?'}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">
                        {entry.username || 'Anonymous'}
                        {entry.id === user?.id && ' (You)'}
                      </p>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Zap className="w-3 h-3 text-yellow-400" />
                          {entry.xp.toLocaleString()} XP
                        </span>
                        <span className="flex items-center gap-1">
                          <Flame className="w-3 h-3 text-orange-400" />
                          {entry.streak} days
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
