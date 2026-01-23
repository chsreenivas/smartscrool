import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Quiz } from '@/hooks/useQuizzes';

const QUIZ_INTERVAL = 25; // Show quiz every 25 videos

interface QuizCheckpoint {
  shouldShowQuiz: boolean;
  checkpointQuiz: Quiz | null;
  videosUntilQuiz: number;
  recordVideoViewed: () => void;
  completeCheckpoint: () => void;
  resetCheckpoint: () => void;
}

export const useQuizCheckpoint = (): QuizCheckpoint => {
  const { user } = useAuth();
  const [videosViewed, setVideosViewed] = useState(0);
  const [shouldShowQuiz, setShouldShowQuiz] = useState(false);
  const [checkpointQuiz, setCheckpointQuiz] = useState<Quiz | null>(null);

  // Load saved progress from localStorage
  useEffect(() => {
    if (user) {
      const saved = localStorage.getItem(`quiz_checkpoint_${user.id}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        setVideosViewed(parsed.videosViewed || 0);
      }
    }
  }, [user]);

  // Save progress to localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem(`quiz_checkpoint_${user.id}`, JSON.stringify({
        videosViewed,
        lastUpdated: new Date().toISOString()
      }));
    }
  }, [user, videosViewed]);

  // Fetch a random quiz when checkpoint is reached
  const fetchRandomQuiz = useCallback(async () => {
    const { data, error } = await supabase
      .from('quizzes')
      .select('*')
      .limit(10);

    if (!error && data && data.length > 0) {
      // Pick a random quiz
      const randomIndex = Math.floor(Math.random() * data.length);
      const quiz = data[randomIndex];
      setCheckpointQuiz({
        id: quiz.id,
        short_id: quiz.short_id,
        question: quiz.question,
        options: quiz.options as string[],
        correct_answer: quiz.correct_answer,
        explanation: (quiz as any).explanation || '',
        xp_reward: quiz.xp_reward,
        created_at: quiz.created_at
      });
    }
  }, []);

  const recordVideoViewed = useCallback(() => {
    setVideosViewed(prev => {
      const newCount = prev + 1;
      
      // Check if we've hit the checkpoint
      if (newCount >= QUIZ_INTERVAL && newCount % QUIZ_INTERVAL === 0) {
        setShouldShowQuiz(true);
        fetchRandomQuiz();
      }
      
      return newCount;
    });
  }, [fetchRandomQuiz]);

  const completeCheckpoint = useCallback(() => {
    setShouldShowQuiz(false);
    setCheckpointQuiz(null);
  }, []);

  const resetCheckpoint = useCallback(() => {
    setVideosViewed(0);
    setShouldShowQuiz(false);
    setCheckpointQuiz(null);
    if (user) {
      localStorage.removeItem(`quiz_checkpoint_${user.id}`);
    }
  }, [user]);

  const videosUntilQuiz = QUIZ_INTERVAL - (videosViewed % QUIZ_INTERVAL);

  return {
    shouldShowQuiz,
    checkpointQuiz,
    videosUntilQuiz,
    recordVideoViewed,
    completeCheckpoint,
    resetCheckpoint
  };
};
