import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Check, Brain, Microscope, BookOpen, DollarSign, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';

const interests = [
  { id: 'Science', icon: Microscope, emoji: '🔬', color: 'from-blue-500 to-cyan-500' },
  { id: 'History', icon: BookOpen, emoji: '📜', color: 'from-amber-500 to-orange-500' },
  { id: 'Psychology', icon: Brain, emoji: '🧠', color: 'from-purple-500 to-pink-500' },
  { id: 'Money', icon: DollarSign, emoji: '💰', color: 'from-green-500 to-emerald-500' },
  { id: 'Technology', icon: Lightbulb, emoji: '💡', color: 'from-yellow-500 to-amber-500' },
];

const Interests = () => {
  const [selected, setSelected] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { updateInterests } = useProfile();

  const toggleInterest = (id: string) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleContinue = async () => {
    if (selected.length === 0) {
      toast.error('Please select at least one interest');
      return;
    }

    setIsLoading(true);
    await updateInterests(selected);
    toast.success('Interests saved!');
    navigate('/feed');
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <motion.div
          className="absolute top-1/4 -left-32 w-64 h-64 rounded-full bg-primary/20 blur-3xl"
          animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Header */}
      <motion.div
        className="text-center mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="font-display text-3xl font-bold mb-2 text-gradient-primary">
          What interests you?
        </h1>
        <p className="text-muted-foreground">
          Pick your favorite topics to personalize your feed
        </p>
      </motion.div>

      {/* Interest Grid */}
      <motion.div
        className="grid grid-cols-2 gap-4 w-full max-w-md mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        {interests.map(({ id, icon: Icon, emoji, color }, index) => {
          const isSelected = selected.includes(id);
          return (
            <motion.button
              key={id}
              onClick={() => toggleInterest(id)}
              className={`relative p-6 rounded-2xl border-2 transition-all ${
                isSelected
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-card hover:border-primary/50'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
            >
              {isSelected && (
                <motion.div
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                >
                  <Check className="w-4 h-4 text-primary-foreground" />
                </motion.div>
              )}
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-3 mx-auto`}>
                <span className="text-2xl">{emoji}</span>
              </div>
              <span className="font-semibold text-foreground">{id}</span>
            </motion.button>
          );
        })}
      </motion.div>

      {/* Continue Button */}
      <motion.div
        className="w-full max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Button
          size="lg"
          className="w-full h-14 text-lg font-semibold bg-gradient-primary hover:opacity-90 transition-opacity"
          onClick={handleContinue}
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : `Continue (${selected.length} selected)`}
        </Button>
      </motion.div>
    </div>
  );
};

export default Interests;
