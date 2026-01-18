import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, XCircle, Zap, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Quiz, useQuizzes } from '@/hooks/useQuizzes';

interface QuizOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  quiz: Quiz;
  onComplete?: (isCorrect: boolean, earnedXP: number) => void;
}

export const QuizOverlay = ({ isOpen, onClose, quiz, onComplete }: QuizOverlayProps) => {
  const { hasAttemptedQuiz, submitAnswer, loading } = useQuizzes();
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [result, setResult] = useState<{ isCorrect: boolean; xpEarned: number } | null>(null);
  const [alreadyAttempted, setAlreadyAttempted] = useState(false);
  const [loadingQuiz, setLoadingQuiz] = useState(true);

  useEffect(() => {
    const checkAttempt = async () => {
      if (!isOpen || !quiz) return;
      setLoadingQuiz(true);
      const attempted = await hasAttemptedQuiz(quiz.id);
      setAlreadyAttempted(attempted);
      setLoadingQuiz(false);
    };

    checkAttempt();
  }, [quiz, isOpen, hasAttemptedQuiz]);

  const handleSubmit = async () => {
    if (!quiz || selectedAnswer === null) return;
    
    const response = await submitAnswer(quiz, selectedAnswer);
    if (!response.error) {
      setResult({ isCorrect: response.isCorrect, xpEarned: response.xpEarned });
      onComplete?.(response.isCorrect, response.xpEarned);
    }
  };

  const handleClose = () => {
    setSelectedAnswer(null);
    setResult(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="relative w-full max-w-md bg-card rounded-2xl p-6 shadow-elevated"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
          >
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>

            {loadingQuiz ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
                <p className="mt-4 text-muted-foreground">Loading quiz...</p>
              </div>
            ) : alreadyAttempted && !result ? (
              <div className="flex flex-col items-center justify-center py-12">
                <CheckCircle className="w-16 h-16 text-success mb-4" />
                <h3 className="text-lg font-semibold mb-2">Already Completed</h3>
                <p className="text-muted-foreground text-center">
                  You've already answered this quiz!
                </p>
              </div>
            ) : result ? (
              <motion.div
                className="flex flex-col items-center justify-center py-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {result.isCorrect ? (
                  <>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', bounce: 0.5 }}
                    >
                      <CheckCircle className="w-20 h-20 text-success mb-4" />
                    </motion.div>
                    <h3 className="text-2xl font-bold text-success mb-2">Correct! 🎉</h3>
                    <div className="flex items-center gap-2 text-yellow-500 mb-4">
                      <Zap className="w-6 h-6" />
                      <span className="text-xl font-bold">+{result.xpEarned} XP</span>
                    </div>
                    {quiz.explanation && (
                      <p className="text-muted-foreground text-center text-sm">
                        {quiz.explanation}
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', bounce: 0.5 }}
                    >
                      <XCircle className="w-20 h-20 text-destructive mb-4" />
                    </motion.div>
                    <h3 className="text-2xl font-bold text-destructive mb-2">Not quite!</h3>
                    <p className="text-muted-foreground text-center mb-4">
                      The correct answer was: <strong>{quiz.options[quiz.correct_answer]}</strong>
                    </p>
                    {quiz.explanation && (
                      <p className="text-muted-foreground text-center text-sm">
                        {quiz.explanation}
                      </p>
                    )}
                  </>
                )}
                <Button onClick={handleClose} className="mt-6">
                  Continue Learning
                </Button>
              </motion.div>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Brain className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Quick Quiz</h3>
                    <p className="text-xs text-muted-foreground">+{quiz.xp_reward} XP for correct answer</p>
                  </div>
                </div>

                <p className="text-lg font-medium mb-6">{quiz.question}</p>

                <div className="space-y-3 mb-6">
                  {quiz.options.map((option, index) => (
                    <motion.button
                      key={index}
                      onClick={() => setSelectedAnswer(index)}
                      className={`w-full p-4 rounded-xl text-left transition-all ${
                        selectedAnswer === index
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted hover:bg-muted/80'
                      }`}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span className="font-medium">{String.fromCharCode(65 + index)}.</span> {option}
                    </motion.button>
                  ))}
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={selectedAnswer === null || loading}
                  className="w-full"
                >
                  {loading ? 'Checking...' : 'Submit Answer'}
                </Button>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
