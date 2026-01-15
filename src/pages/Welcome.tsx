import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Play, Sparkles, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

const Welcome = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      navigate('/feed');
    }
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <motion.div
          className="absolute top-1/4 -left-32 w-64 h-64 rounded-full bg-primary/20 blur-3xl"
          animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-1/4 -right-32 w-96 h-96 rounded-full bg-accent/20 blur-3xl"
          animate={{ x: [0, -30, 0], y: [0, -50, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Logo */}
      <motion.div
        className="flex items-center gap-3 mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center">
          <Brain className="w-10 h-10 text-primary-foreground" />
        </div>
      </motion.div>

      {/* Title */}
      <motion.h1
        className="font-display text-5xl md:text-6xl font-bold text-center mb-4 text-gradient-primary"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        BrainScroll
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        className="text-xl text-muted-foreground text-center mb-12 max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        Learn something new in 60 seconds. Swipe through educational shorts & level up your brain.
      </motion.p>

      {/* Features */}
      <motion.div
        className="flex flex-wrap justify-center gap-4 mb-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        {[
          { icon: Play, text: 'Short Videos' },
          { icon: Sparkles, text: 'Earn XP' },
          { icon: Brain, text: 'Build Streaks' },
        ].map(({ icon: Icon, text }) => (
          <div
            key={text}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-secondary-foreground"
          >
            <Icon className="w-4 h-4" />
            <span className="text-sm font-medium">{text}</span>
          </div>
        ))}
      </motion.div>

      {/* CTA Buttons */}
      <motion.div
        className="flex flex-col gap-4 w-full max-w-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <Button
          size="lg"
          className="w-full h-14 text-lg font-semibold bg-gradient-primary hover:opacity-90 transition-opacity"
          onClick={() => navigate('/auth')}
        >
          Get Started
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="w-full h-14 text-lg font-semibold"
          onClick={() => navigate('/auth?mode=login')}
        >
          I already have an account
        </Button>
      </motion.div>

      {/* Footer */}
      <motion.p
        className="text-sm text-muted-foreground mt-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.5 }}
      >
        Join thousands of learners worldwide
      </motion.p>
    </div>
  );
};

export default Welcome;
