import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from './useProfile';

export interface Quiz {
  id: string;
  short_id: string;
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string | null;
  xp_reward: number;
  created_at: string;
}

export interface QuizAttempt {
  id: string;
  user_id: string;
  quiz_id: string;
  selected_answer: number;
  is_correct: boolean;
  xp_earned: number;
  created_at: string;
}

export const useQuizzes = () => {
  const { user } = useAuth();
  const { addXP } = useProfile();
  const [loading, setLoading] = useState(false);

  const getQuizForShort = async (shortId: string): Promise<Quiz | null> => {
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('short_id', shortId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // No quiz found
        throw error;
      }

      return {
        ...data,
        options: data.options as string[]
      };
    } catch (error) {
      console.error('Error fetching quiz:', error);
      return null;
    }
  };

  const hasAttemptedQuiz = async (quizId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .from('quiz_attempts')
        .select('id')
        .eq('quiz_id', quizId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    } catch (error) {
      console.error('Error checking quiz attempt:', error);
      return false;
    }
  };

  const submitAnswer = async (
    quiz: Quiz,
    selectedAnswer: number
  ): Promise<{ isCorrect: boolean; xpEarned: number; error: string | null }> => {
    if (!user) {
      return { isCorrect: false, xpEarned: 0, error: 'Not authenticated' };
    }

    setLoading(true);
    try {
      const isCorrect = selectedAnswer === quiz.correct_answer;
      const xpEarned = isCorrect ? quiz.xp_reward : 0;

      // Record the attempt
      const { error } = await supabase
        .from('quiz_attempts')
        .insert({
          user_id: user.id,
          quiz_id: quiz.id,
          selected_answer: selectedAnswer,
          is_correct: isCorrect,
          xp_earned: xpEarned
        });

      if (error) throw error;

      // Add XP to profile if correct
      if (xpEarned > 0) {
        await addXP(xpEarned);
      }

      return { isCorrect, xpEarned, error: null };
    } catch (error: any) {
      console.error('Error submitting answer:', error);
      return { isCorrect: false, xpEarned: 0, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const getUserQuizStats = useCallback(async () => {
    if (!user) return { total: 0, correct: 0, xpEarned: 0 };

    try {
      const { data, error } = await supabase
        .from('quiz_attempts')
        .select('is_correct, xp_earned')
        .eq('user_id', user.id);

      if (error) throw error;

      const total = data?.length || 0;
      const correct = data?.filter(a => a.is_correct).length || 0;
      const xpEarned = data?.reduce((sum, a) => sum + (a.xp_earned || 0), 0) || 0;

      return { total, correct, xpEarned };
    } catch (error) {
      console.error('Error fetching quiz stats:', error);
      return { total: 0, correct: 0, xpEarned: 0 };
    }
  }, [user]);

  return {
    loading,
    getQuizForShort,
    hasAttemptedQuiz,
    submitAnswer,
    getUserQuizStats
  };
};
