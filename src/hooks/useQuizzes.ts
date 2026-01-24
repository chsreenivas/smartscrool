import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Quiz {
  id: string;
  short_id: string;
  question: string;
  options: string[];
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

export interface QuizResult {
  isCorrect: boolean;
  xpEarned: number;
  correctAnswer: number | null;
  error: string | null;
}

export const useQuizzes = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // Fetch quiz from the secure RPC function (excludes correct_answer)
  const getQuizForShort = async (shortId: string): Promise<Quiz | null> => {
    try {
      const { data, error } = await supabase.rpc('get_quiz_for_short', { 
        p_short_id: shortId 
      });

      if (error) {
        if (error.code === 'PGRST116') return null;
        console.error('Error fetching quiz:', error);
        return null;
      }

      if (!data || data.length === 0) return null;

      const quiz = data[0];
      return {
        id: quiz.id,
        short_id: quiz.short_id,
        question: quiz.question,
        options: quiz.options as string[],
        xp_reward: quiz.xp_reward,
        created_at: quiz.created_at
      };
    } catch (error) {
      console.error('Error fetching quiz:', error);
      return null;
    }
  };

  const hasAttemptedQuiz = async (quizId: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await (supabase
        .from('quiz_attempts' as any)
        .select('id')
        .eq('quiz_id', quizId)
        .eq('user_id', user.id)
        .maybeSingle() as any);

      if (error) throw error;
      return !!data;
    } catch (error) {
      console.error('Error checking quiz attempt:', error);
      return false;
    }
  };

  // Use server-side function to submit answer (prevents cheating)
  const submitAnswer = async (
    quiz: Quiz,
    selectedAnswer: number
  ): Promise<QuizResult> => {
    if (!user) {
      return { isCorrect: false, xpEarned: 0, correctAnswer: null, error: 'Not authenticated' };
    }

    setLoading(true);
    try {
      // Call secure server-side function
      const { data, error } = await supabase.rpc('submit_quiz_answer', {
        p_quiz_id: quiz.id,
        p_selected_answer: selectedAnswer
      });

      if (error) throw error;

      const result = data as { success: boolean; is_correct?: boolean; xp_earned?: number; correct_answer?: number; error?: string };

      if (!result.success) {
        return { isCorrect: false, xpEarned: 0, correctAnswer: null, error: result.error || 'Unknown error' };
      }

      return { 
        isCorrect: result.is_correct || false, 
        xpEarned: result.xp_earned || 0, 
        correctAnswer: result.correct_answer ?? null,
        error: null 
      };
    } catch (error: any) {
      console.error('Error submitting answer:', error);
      return { isCorrect: false, xpEarned: 0, correctAnswer: null, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const getUserQuizStats = useCallback(async () => {
    if (!user) return { total: 0, correct: 0, xpEarned: 0 };

    try {
      const { data, error } = await (supabase
        .from('quiz_attempts' as any)
        .select('is_correct, xp_earned')
        .eq('user_id', user.id) as any);

      if (error) throw error;

      const attempts = (data as any[]) || [];
      const total = attempts.length;
      const correct = attempts.filter((a: any) => a.is_correct).length;
      const xpEarned = attempts.reduce((sum: number, a: any) => sum + (a.xp_earned || 0), 0);

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
