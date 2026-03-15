import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Brain, ArrowLeft, CheckCircle, XCircle, Trophy, Sparkles, Loader2, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

interface QuizQuestion {
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string;
  category: string;
}

interface QuizState {
  questions: QuizQuestion[];
  currentIndex: number;
  answers: (number | null)[];
  showResult: boolean;
  finished: boolean;
}

const PersonalQuiz = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quiz, setQuiz] = useState<QuizState | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  const generateQuiz = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('generate-history-quiz');

      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);

      const questions: QuizQuestion[] = data.data.questions;
      setQuiz({
        questions,
        currentIndex: 0,
        answers: new Array(questions.length).fill(null),
        showResult: false,
        finished: false,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to generate quiz');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    generateQuiz();
  }, [generateQuiz]);

  const handleAnswer = (index: number) => {
    if (showExplanation) return;
    setSelectedAnswer(index);
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null || !quiz) return;
    setShowExplanation(true);

    const newAnswers = [...quiz.answers];
    newAnswers[quiz.currentIndex] = selectedAnswer;
    setQuiz({ ...quiz, answers: newAnswers });
  };

  const handleNext = () => {
    if (!quiz) return;
    const nextIndex = quiz.currentIndex + 1;
    
    if (nextIndex >= quiz.questions.length) {
      setQuiz({ ...quiz, finished: true, currentIndex: nextIndex - 1 });
    } else {
      setQuiz({ ...quiz, currentIndex: nextIndex });
    }
    setSelectedAnswer(null);
    setShowExplanation(false);
  };

  const score = quiz ? quiz.answers.filter((a, i) => a === quiz.questions[i]?.correct_answer).length : 0;
  const total = quiz?.questions.length ?? 0;
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
  const passed = percentage >= 70;

  // Award achievement on pass
  useEffect(() => {
    if (quiz?.finished && passed) {
      toast.success('🏆 Achievement Unlocked: Smart Learner!', { description: `You scored ${percentage}%!` });
    }
  }, [quiz?.finished, passed, percentage]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div className="text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-lg font-medium text-foreground">Generating your personalized quiz...</p>
          <p className="text-sm text-muted-foreground mt-1">Based on your last 25 watched videos</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div className="text-center max-w-md" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Can't Generate Quiz</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => navigate('/feed')} className="px-5 py-2.5 rounded-full bg-muted text-foreground font-medium hover:bg-muted/80 transition-colors">
              Watch Videos
            </button>
            <button onClick={generateQuiz} className="px-5 py-2.5 rounded-full bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity">
              Try Again
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!quiz) return null;

  // Results screen
  if (quiz.finished) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 px-4 py-4 bg-background/80 backdrop-blur-md border-b border-border/50">
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            <button onClick={() => navigate('/')} className="p-2 rounded-full hover:bg-muted transition-colors">
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <h1 className="font-display font-bold text-lg text-foreground">Quiz Results</h1>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 py-8">
          <motion.div className="text-center mb-8" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            {passed ? (
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-success/20 mb-4">
                <Trophy className="w-12 h-12 text-success" />
              </div>
            ) : (
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-destructive/20 mb-4">
                <Brain className="w-12 h-12 text-destructive" />
              </div>
            )}
            <h2 className="text-3xl font-display font-bold text-foreground mb-1">
              {percentage}%
            </h2>
            <p className="text-muted-foreground">
              {score} of {total} correct
            </p>
            {passed && (
              <motion.div
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 border border-success/30 text-success font-medium"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Sparkles className="w-4 h-4" />
                Smart Learner Achievement Unlocked!
              </motion.div>
            )}
          </motion.div>

          <div className="space-y-4">
            {quiz.questions.map((q, i) => {
              const userAnswer = quiz.answers[i];
              const isCorrect = userAnswer === q.correct_answer;
              return (
                <motion.div
                  key={i}
                  className="p-4 rounded-xl bg-card border border-border/50"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                >
                  <div className="flex items-start gap-3">
                    {isCorrect ? (
                      <CheckCircle className="w-5 h-5 text-success mt-0.5 shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm mb-1">{q.question}</p>
                      {!isCorrect && (
                        <p className="text-xs text-muted-foreground">
                          Correct: {q.options[q.correct_answer]}
                        </p>
                      )}
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground shrink-0">
                      {q.category}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="flex gap-3 justify-center mt-8">
            <button onClick={() => navigate('/feed')} className="px-5 py-2.5 rounded-full bg-muted text-foreground font-medium hover:bg-muted/80 transition-colors">
              Back to Feed
            </button>
            <button onClick={() => { setQuiz(null); generateQuiz(); }} className="px-5 py-2.5 rounded-full bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity">
              New Quiz
            </button>
          </div>
        </main>
      </div>
    );
  }

  // Quiz question screen
  const currentQ = quiz.questions[quiz.currentIndex];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 px-4 py-4 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="p-2 rounded-full hover:bg-muted transition-colors">
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <h1 className="font-display font-bold text-lg text-foreground">Your Learning Quiz</h1>
          </div>
          <span className="text-sm text-muted-foreground font-medium">
            {quiz.currentIndex + 1} / {quiz.questions.length}
          </span>
        </div>
        {/* Progress bar */}
        <div className="max-w-2xl mx-auto mt-3">
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${((quiz.currentIndex + (showExplanation ? 1 : 0)) / quiz.questions.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={quiz.currentIndex}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
          >
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-medium mb-4">
              {currentQ.category}
            </span>

            <h2 className="text-xl font-display font-bold text-foreground mb-6">
              {currentQ.question}
            </h2>

            <div className="space-y-3">
              {currentQ.options.map((option, idx) => {
                let cls = 'bg-card border-border/50 hover:border-primary/50 text-foreground';
                if (showExplanation) {
                  if (idx === currentQ.correct_answer) cls = 'bg-success/10 border-success text-success';
                  else if (idx === selectedAnswer) cls = 'bg-destructive/10 border-destructive text-destructive';
                  else cls = 'bg-muted/30 border-transparent text-muted-foreground opacity-50';
                } else if (selectedAnswer === idx) {
                  cls = 'bg-primary/10 border-primary text-foreground';
                }

                return (
                  <motion.button
                    key={idx}
                    onClick={() => handleAnswer(idx)}
                    disabled={showExplanation}
                    className={`w-full text-left px-4 py-3 rounded-xl border-2 font-medium transition-all ${cls}`}
                    whileHover={!showExplanation ? { scale: 1.01 } : {}}
                    whileTap={!showExplanation ? { scale: 0.99 } : {}}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-full bg-muted/50 flex items-center justify-center text-sm font-bold shrink-0">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="flex-1">{option}</span>
                      {showExplanation && idx === currentQ.correct_answer && <CheckCircle className="w-5 h-5 text-success shrink-0" />}
                      {showExplanation && idx === selectedAnswer && idx !== currentQ.correct_answer && <XCircle className="w-5 h-5 text-destructive shrink-0" />}
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Explanation */}
            <AnimatePresence>
              {showExplanation && (
                <motion.div
                  className={`mt-6 p-4 rounded-xl ${selectedAnswer === currentQ.correct_answer ? 'bg-success/10 border border-success/30' : 'bg-destructive/10 border border-destructive/30'}`}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <p className="text-sm text-foreground/80">{currentQ.explanation}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-8 flex justify-end">
              {!showExplanation ? (
                <button
                  onClick={handleSubmitAnswer}
                  disabled={selectedAnswer === null}
                  className="px-6 py-2.5 rounded-full bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
                >
                  Submit Answer
                </button>
              ) : (
                <button onClick={handleNext} className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity">
                  {quiz.currentIndex + 1 < quiz.questions.length ? 'Next Question' : 'See Results'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default PersonalQuiz;
