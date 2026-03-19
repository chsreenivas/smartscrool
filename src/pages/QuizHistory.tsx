import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy, TrendingUp, Calendar, Brain, BarChart3 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface QuizResult {
  id: string;
  score: number;
  total: number;
  percentage: number;
  passed: boolean;
  xp_earned: number;
  created_at: string;
}

const QuizHistory = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [results, setResults] = useState<QuizResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await (supabase as any)
        .from('quiz_history')
        .select('id, score, total, percentage, passed, xp_earned, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      setResults(data || []);
      setLoading(false);
    };
    fetch();
  }, [user]);

  const avgScore = results.length > 0
    ? Math.round(results.reduce((s, r) => s + r.percentage, 0) / results.length)
    : 0;
  const totalXP = results.reduce((s, r) => s + r.xp_earned, 0);
  const passRate = results.length > 0
    ? Math.round((results.filter(r => r.passed).length / results.length) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 px-4 py-4 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button onClick={() => navigate('/')} className="p-2 rounded-full hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="font-display font-bold text-lg text-foreground">Quiz History</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { label: 'Avg Score', value: `${avgScore}%`, icon: BarChart3, color: 'text-primary' },
            { label: 'Pass Rate', value: `${passRate}%`, icon: TrendingUp, color: 'text-success' },
            { label: 'XP Earned', value: `${totalXP}`, icon: Trophy, color: 'text-warning' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              className="p-4 rounded-xl bg-card border border-border/50 text-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <stat.icon className={`w-5 h-5 mx-auto mb-1 ${stat.color}`} />
              <p className="text-xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <Brain className="w-8 h-8 text-muted-foreground animate-pulse mx-auto mb-2" />
            <p className="text-muted-foreground">Loading history...</p>
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-12">
            <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-foreground font-medium mb-1">No quizzes taken yet</p>
            <p className="text-sm text-muted-foreground mb-4">Take your first personalized quiz!</p>
            <button
              onClick={() => navigate('/quiz')}
              className="px-5 py-2.5 rounded-full bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
            >
              Start Quiz
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {results.map((r, i) => (
              <motion.div
                key={r.id}
                className="p-4 rounded-xl bg-card border border-border/50 flex items-center justify-between"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${r.passed ? 'bg-success/20' : 'bg-destructive/20'}`}>
                    {r.passed ? <Trophy className="w-5 h-5 text-success" /> : <Brain className="w-5 h-5 text-destructive" />}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{r.score}/{r.total} correct</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      {new Date(r.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-lg font-bold ${r.passed ? 'text-success' : 'text-destructive'}`}>{r.percentage}%</p>
                  {r.xp_earned > 0 && (
                    <p className="text-xs text-warning">+{r.xp_earned} XP</p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default QuizHistory;
