import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight } from 'lucide-react';

const topics = [
  { slug: 'math', title: 'Math', icon: '🔢', description: 'From basics to calculus' },
  { slug: 'science', title: 'Science', icon: '🔬', description: 'Physics, chemistry, biology' },
  { slug: 'history', title: 'Early American History', icon: '📜', description: 'Stories that shaped America' },
  { slug: 'psychology', title: 'Psychology', icon: '🧠', description: 'Mind and human behavior' },
  { slug: 'ela', title: 'ELA', icon: '📚', description: 'Reading, writing, language arts' },
  { slug: 'money', title: 'Money & Finance', icon: '💰', description: 'Personal finance skills' },
  { slug: 'technology', title: 'Technology', icon: '💻', description: 'Code and digital literacy' },
  { slug: 'sat-prep', title: 'SAT Prep', icon: '📝', description: 'Ace your SAT' },
  { slug: 'music', title: 'Music', icon: '🎵', description: 'Guitar, piano, basics' },
  { slug: 'philosophy', title: 'Philosophy', icon: '💭', description: 'Big ideas made simple' },
];

const Topics = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-30 px-4 py-3 flex items-center gap-4 bg-background/80 backdrop-blur-md border-b border-border/50">
        <button onClick={() => navigate('/feed')} className="p-2 -ml-2">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="font-display text-lg font-bold">Browse Topics</h1>
      </header>

      <main className="pt-20 pb-8 px-4 max-w-lg mx-auto">
        <motion.p
          className="text-muted-foreground mb-6 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          Dive deep into any subject. Learn at your own pace.
        </motion.p>

        <div className="space-y-3">
          {topics.map((topic, index) => (
            <motion.button
              key={topic.slug}
              onClick={() => navigate(`/topic/${topic.slug}`)}
              className="w-full flex items-center gap-4 p-4 rounded-xl bg-card border border-border/50 hover:border-primary/50 transition-colors text-left"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="text-3xl">{topic.icon}</span>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">{topic.title}</h3>
                <p className="text-sm text-muted-foreground">{topic.description}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </motion.button>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Topics;
