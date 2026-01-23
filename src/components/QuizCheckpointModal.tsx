import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, CheckCircle, XCircle, Zap, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Quiz, useQuizzes } from '@/hooks/useQuizzes';

interface QuizCheckpointModalProps {
  isOpen: boolean;
  quiz: Quiz | null;
  onComplete: (isCorrect: boolean, xpEarned: number) => void;
  videosWatched: number;
}

export const QuizCheckpointModal = ({ 
  isOpen, 
  quiz, 
  onComplete,
  videosWatched 
}: QuizCheckpointModalProps) => {
  const { submitAnswer, loading } = useQuizzes();
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [result, setResult] = useState<{ isCorrect: boolean; xpEarned: number } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (selectedAnswer === null || !quiz || isSubmitting) return;
    
    setIsSubmitting(true);
    const submitResult = await submitAnswer(quiz, selectedAnswer);
    
    if (submitResult.error) {
      setIsSubmitting(false);
      return;
    }
    
    setResult({
      isCorrect: submitResult.isCorrect,
      xpEarned: submitResult.xpEarned
    });
    setIsSubmitting(false);
  };

  const handleContinue = () => {
    if (result) {
      onComplete(result.isCorrect, result.xpEarned);
      setSelectedAnswer(null);
      setResult(null);
    }
  };

  if (!quiz) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-full max-w-lg bg-card rounded-2xl overflow-hidden shadow-2xl"
            initial={{ scale: 0.9, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 50 }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary to-primary/80 p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-white/20 flex items-center justify-center">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <h2 className="font-display text-xl font-bold text-white">
                🎯 Learning Checkpoint!
              </h2>
              <p className="text-white/80 text-sm mt-1">
                You've watched {videosWatched} videos! Time to test your knowledge.
              </p>
            </div>

            {/* Content */}
            <div className="p-6">
              {!result ? (
                <>
                  {/* Question */}
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <BookOpen className="w-5 h-5 text-primary" />
                      <span className="text-sm font-medium text-muted-foreground">
                        Answer correctly to continue
                      </span>
                    </div>
                    <p className="text-lg font-medium">{quiz.question}</p>
                  </div>

                  {/* Options */}
                  <div className="space-y-3 mb-6">
                    {quiz.options.map((option, index) => (
                      <motion.button
                        key={index}
                        onClick={() => setSelectedAnswer(index)}
                        className={`w-full p-4 rounded-xl text-left transition-all ${
                          selectedAnswer === index
                            ? 'bg-primary/20 border-2 border-primary'
                            : 'bg-secondary/50 border-2 border-transparent hover:border-primary/30'
                        }`}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            selectedAnswer === index
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            {String.fromCharCode(65 + index)}
                          </div>
                          <span className="flex-1">{option}</span>
                        </div>
                      </motion.button>
                    ))}
                  </div>

                  {/* Submit */}
                  <Button
                    onClick={handleSubmit}
                    disabled={selectedAnswer === null || isSubmitting || loading}
                    className="w-full"
                    size="lg"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Checking...
                      </span>
                    ) : (
                      'Submit Answer'
                    )}
                  </Button>
                </>
              ) : (
                <motion.div
                  className="text-center py-6"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  {result.isCorrect ? (
                    <>
                      <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                        <CheckCircle className="w-10 h-10 text-green-500" />
                      </div>
                      <h3 className="text-2xl font-bold text-green-500 mb-2">
                        Correct! 🎉
                      </h3>
                      <div className="flex items-center justify-center gap-2 text-yellow-500 mb-4">
                        <Zap className="w-5 h-5" />
                        <span className="font-bold">+{result.xpEarned} XP</span>
                      </div>
                      <p className="text-muted-foreground mb-6">
                        Great job! Keep learning and growing.
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
                        <XCircle className="w-10 h-10 text-red-500" />
                      </div>
                      <h3 className="text-2xl font-bold text-red-500 mb-2">
                        Not quite!
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        The correct answer was:{' '}
                        <span className="font-medium text-foreground">
                          {quiz.options[quiz.correct_answer]}
                        </span>
                      </p>
                      {quiz.explanation && (
                        <p className="text-sm text-muted-foreground bg-secondary/50 p-3 rounded-lg mb-6">
                          💡 {quiz.explanation}
                        </p>
                      )}
                    </>
                  )}
                  
                  <Button onClick={handleContinue} className="w-full" size="lg">
                    Continue Watching
                  </Button>
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
