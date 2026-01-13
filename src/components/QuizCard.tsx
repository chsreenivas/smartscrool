import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Sparkles, ArrowRight } from 'lucide-react';
import { QuizCard as QuizCardType } from '@/types/content';

interface QuizCardProps {
  card: QuizCardType;
  onAnswer: (correct: boolean) => void;
  index: number;
}

export const QuizCard = ({ card, onAnswer, index }: QuizCardProps) => {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);

  const handleAnswer = (answerIndex: number) => {
    if (selectedAnswer !== null) return;
    
    setSelectedAnswer(answerIndex);
    setShowResult(true);
    
    setTimeout(() => {
      onAnswer(answerIndex === card.correctAnswer);
    }, 2000);
  };

  const isCorrect = selectedAnswer === card.correctAnswer;

  return (
    <motion.div
      className="w-full h-full flex items-center justify-center p-6"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.4 }}
    >
      <div className="w-full max-w-md bg-gradient-card rounded-2xl shadow-elevated overflow-hidden border border-primary/30">
        {/* Quiz Header */}
        <div className="bg-gradient-primary px-6 py-4">
          <div className="flex items-center gap-2 text-primary-foreground">
            <Sparkles className="w-5 h-5" />
            <span className="font-display font-bold text-lg">Quiz Time!</span>
          </div>
        </div>

        {/* Question */}
        <div className="px-6 py-6">
          <motion.div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground text-sm font-medium mb-4"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <span className="text-lg">{card.emoji}</span>
            <span>{card.category}</span>
          </motion.div>

          <motion.h3
            className="font-display text-xl font-bold mb-6 text-foreground"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {card.question}
          </motion.h3>

          {/* Options */}
          <div className="space-y-3">
            {card.options.map((option, idx) => {
              const isSelected = selectedAnswer === idx;
              const isCorrectOption = idx === card.correctAnswer;
              
              let buttonClass = 'bg-secondary hover:bg-secondary/80 text-foreground border-transparent';
              
              if (showResult) {
                if (isCorrectOption) {
                  buttonClass = 'bg-success/20 border-success text-success';
                } else if (isSelected && !isCorrect) {
                  buttonClass = 'bg-destructive/20 border-destructive text-destructive';
                } else {
                  buttonClass = 'bg-muted/50 text-muted-foreground border-transparent opacity-50';
                }
              }

              return (
                <motion.button
                  key={idx}
                  onClick={() => handleAnswer(idx)}
                  disabled={selectedAnswer !== null}
                  className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all font-medium ${buttonClass}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + idx * 0.05 }}
                  whileHover={selectedAnswer === null ? { scale: 1.02, x: 8 } : {}}
                  whileTap={selectedAnswer === null ? { scale: 0.98 } : {}}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-background/50 flex items-center justify-center text-sm font-bold">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="flex-1">{option}</span>
                    {showResult && isCorrectOption && (
                      <CheckCircle className="w-5 h-5 text-success" />
                    )}
                    {showResult && isSelected && !isCorrect && (
                      <XCircle className="w-5 h-5 text-destructive" />
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Result Explanation */}
          <AnimatePresence>
            {showResult && (
              <motion.div
                className={`mt-6 p-4 rounded-xl ${
                  isCorrect 
                    ? 'bg-success/10 border border-success/30' 
                    : 'bg-destructive/10 border border-destructive/30'
                }`}
                initial={{ opacity: 0, y: 20, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="flex items-center gap-2 mb-2">
                  {isCorrect ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-success" />
                      <span className="font-display font-bold text-success">Correct!</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-destructive" />
                      <span className="font-display font-bold text-destructive">Not quite!</span>
                    </>
                  )}
                </div>
                <p className="text-sm text-foreground/80">{card.explanation}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};
