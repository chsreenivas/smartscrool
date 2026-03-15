import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Circle, Lock, BookOpen, Brain, FlaskConical, Flame } from 'lucide-react';
import { useLearningPaths } from '@/hooks/useLearningPaths';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

const LearningPaths = () => {
  const navigate = useNavigate();
  const { paths, loading, completeStep } = useLearningPaths();
  const { profile } = useProfile();

  const handleCompleteStep = async (stepId: string, pathId: string, stepType: string) => {
    await completeStep(stepId, pathId);
    if (stepType === 'quiz') {
      toast.success('Quiz step completed! 🎉');
    } else {
      toast.success('Step completed! Keep going! ✅');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <motion.header
        className="sticky top-0 z-50 px-4 py-3 flex items-center gap-3 bg-background/90 backdrop-blur-sm border-b border-border/50"
        initial={{ y: -50 }}
        animate={{ y: 0 }}
      >
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-foreground">Learning Paths</h1>
          <p className="text-xs text-muted-foreground">Structured learning journeys</p>
        </div>
        {profile && (
          <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-muted/50">
            <Flame className="w-4 h-4 text-orange-400" />
            <span className="text-sm font-semibold text-foreground">{profile.streak}</span>
          </div>
        )}
      </motion.header>

      {/* Brain Streak Banner */}
      {profile && profile.streak > 0 && (
        <motion.div
          className="mx-4 mt-4 p-4 rounded-xl bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3">
            <div className="text-3xl">🔥</div>
            <div>
              <p className="font-bold text-foreground">Brain Streak: {profile.streak} Day{profile.streak !== 1 ? 's' : ''}!</p>
              <p className="text-xs text-muted-foreground">Watch 3 videos or complete 1 quiz daily to keep it going</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Paths */}
      <div className="px-4 mt-6 space-y-6">
        {paths.map((path, pathIdx) => {
          const progressPct = path.steps.length > 0
            ? (path.completedSteps / path.steps.length) * 100
            : 0;

          return (
            <motion.div
              key={path.id}
              className="rounded-xl bg-card border border-border/50 overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: pathIdx * 0.1 }}
            >
              {/* Path Header */}
              <div className="p-4 border-b border-border/30">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{path.icon}</span>
                  <div className="flex-1">
                    <h2 className="font-bold text-foreground">{path.title}</h2>
                    <p className="text-xs text-muted-foreground">{path.description}</p>
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">
                    {path.completedSteps}/{path.steps.length}
                  </span>
                </div>
                <Progress value={progressPct} className="h-2" />
              </div>

              {/* Steps Checklist */}
              <div className="p-4 space-y-1">
                {path.steps.map((step, stepIdx) => (
                  <motion.div
                    key={step.id}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                      step.completed
                        ? 'bg-primary/10'
                        : step.unlocked
                          ? 'bg-muted/30 hover:bg-muted/50 cursor-pointer'
                          : 'opacity-50'
                    }`}
                    onClick={() => {
                      if (step.unlocked && !step.completed) {
                        handleCompleteStep(step.id, path.id, step.step_type);
                      }
                    }}
                    whileTap={step.unlocked && !step.completed ? { scale: 0.98 } : {}}
                  >
                    {/* Step Icon */}
                    {step.completed ? (
                      <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                    ) : step.unlocked ? (
                      <Circle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    ) : (
                      <Lock className="w-5 h-5 text-muted-foreground/50 flex-shrink-0" />
                    )}

                    {/* Connector line */}
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${step.completed ? 'text-primary' : 'text-foreground'}`}>
                        {step.title}
                      </p>
                      <p className="text-xs text-muted-foreground">{step.description}</p>
                    </div>

                    {/* Step type badge */}
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      step.step_type === 'quiz'
                        ? 'bg-accent/20 text-accent-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {step.step_type === 'quiz' ? '📝 Quiz' : '▶️ Video'}
                    </span>
                  </motion.div>
                ))}
              </div>

              {/* Completed badge */}
              {progressPct === 100 && (
                <div className="px-4 pb-4">
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/10 text-primary text-sm font-medium">
                    <CheckCircle className="w-4 h-4" />
                    Path Completed! 🎉
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default LearningPaths;
