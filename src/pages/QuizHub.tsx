import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Brain, BookOpen, Calculator, FlaskConical, History, Music, Lightbulb, DollarSign, Laptop, GraduationCap, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const quizTopics = [
  { id: 'math', name: 'Math', icon: Calculator, color: 'from-blue-500 to-blue-600', description: 'Algebra, geometry, and more' },
  { id: 'science', name: 'Science', icon: FlaskConical, color: 'from-green-500 to-green-600', description: 'Physics, chemistry, biology' },
  { id: 'history', name: 'History', icon: History, color: 'from-amber-500 to-amber-600', description: 'World events and civilizations' },
  { id: 'music', name: 'Music', icon: Music, color: 'from-pink-500 to-pink-600', description: 'Theory, instruments, composers' },
  { id: 'philosophy', name: 'Philosophy', icon: Lightbulb, color: 'from-purple-500 to-purple-600', description: 'Big questions, deep thinking' },
  { id: 'money', name: 'Money', icon: DollarSign, color: 'from-emerald-500 to-emerald-600', description: 'Personal finance basics' },
  { id: 'technology', name: 'Technology', icon: Laptop, color: 'from-cyan-500 to-cyan-600', description: 'Coding, AI, and innovation' },
  { id: 'sat-prep', name: 'SAT Prep', icon: GraduationCap, color: 'from-orange-500 to-orange-600', description: 'Test-taking strategies' },
];

const QuizHub = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleStartQuiz = (topicId: string) => {
    navigate(`/topic/${topicId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <motion.div
          className="absolute top-1/4 -left-32 w-64 h-64 rounded-full bg-primary/10 blur-3xl"
          animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full bg-accent/10 blur-3xl"
          animate={{ x: [0, -30, 0], y: [0, -50, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <motion.header
        className="sticky top-0 z-50 px-4 py-4 bg-background/80 backdrop-blur-md border-b border-border/50"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button 
            onClick={() => navigate('/feed')}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
              <Brain className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-xl text-foreground">Smart Scroll</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/feed')}
              className="px-4 py-2 rounded-full bg-muted/50 text-foreground text-sm font-medium hover:bg-muted transition-colors"
            >
              Watch Videos
            </button>
            {user ? (
              <button
                onClick={() => navigate('/profile')}
                className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Profile
              </button>
            ) : (
              <button
                onClick={() => navigate('/auth')}
                className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </motion.header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <BookOpen className="w-8 h-8 text-primary" />
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground">
              Quiz Hub
            </h1>
          </div>
          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            Test your knowledge with optional quizzes. Pick a topic and challenge yourself!
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quizTopics.map((topic, index) => (
            <motion.button
              key={topic.id}
              onClick={() => handleStartQuiz(topic.id)}
              className="group relative p-6 rounded-2xl bg-card border border-border/50 text-left overflow-hidden hover:border-primary/50 transition-all duration-300"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${topic.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${topic.color} flex items-center justify-center mb-4`}>
                <topic.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                {topic.name}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {topic.description}
              </p>
              <div className="flex items-center gap-2 text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                <span>Start Quiz</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.button>
          ))}
        </div>

        <motion.div
          className="mt-12 text-center space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <button
            onClick={() => navigate('/quiz')}
            className="px-6 py-3 rounded-full bg-gradient-accent text-accent-foreground font-medium hover:opacity-90 transition-opacity inline-flex items-center gap-2"
          >
            <Sparkles className="w-5 h-5" />
            Take Your Personalized Quiz
          </button>
          <p className="text-muted-foreground text-sm">
            Based on the videos you've watched
          </p>
          <div className="pt-2">
            <button
              onClick={() => navigate('/quiz-history')}
              className="text-sm text-primary hover:underline"
            >
              View Quiz History →
            </button>
          </div>
          <div className="pt-4">
            <p className="text-muted-foreground mb-4">
              Want to learn through videos instead?
            </p>
            <button
              onClick={() => navigate('/feed')}
              className="px-6 py-3 rounded-full bg-gradient-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
            >
              Browse Video Feed
            </button>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default QuizHub;
