import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Quiz } from '@/hooks/useQuizzes';

const QUIZ_INTERVAL = 25;

interface TopicQuizCheckpoint {
  shouldShowQuiz: boolean;
  checkpointQuiz: Quiz | null;
  videosUntilQuiz: number;
  videosWatched: number;
  recordVideoViewed: () => Promise<void>;
  completeCheckpoint: () => void;
}

export const useTopicQuizCheckpoint = (topic: string): TopicQuizCheckpoint => {
  const { user } = useAuth();
  const [videosWatched, setVideosWatched] = useState(0);
  const [shouldShowQuiz, setShouldShowQuiz] = useState(false);
  const [checkpointQuiz, setCheckpointQuiz] = useState<Quiz | null>(null);

  // Load progress from database
  useEffect(() => {
    const loadProgress = async () => {
      if (!user || !topic) return;

      const { data } = await supabase
        .from('topic_quiz_progress')
        .select('videos_watched')
        .eq('user_id', user.id)
        .eq('topic', topic)
        .single();

      if (data) {
        setVideosWatched(data.videos_watched);
      }
    };

    loadProgress();
  }, [user, topic]);

  // Fetch a quiz for this topic
  const fetchTopicQuiz = useCallback(async () => {
    // Get shorts in this category that have quizzes
    const { data: shorts } = await supabase
      .from('shorts')
      .select('id')
      .eq('category', topic)
      .eq('is_approved', true)
      .limit(20);

    if (!shorts || shorts.length === 0) return;

    // Try to find a quiz
    const shuffled = [...shorts].sort(() => Math.random() - 0.5);
    
    for (const short of shuffled) {
      const { data, error } = await supabase.rpc('get_quiz_for_short', {
        p_short_id: short.id
      });

      if (!error && data && data.length > 0) {
        const quiz = data[0];
        setCheckpointQuiz({
          id: quiz.id,
          short_id: quiz.short_id,
          question: quiz.question,
          options: quiz.options as string[],
          xp_reward: quiz.xp_reward,
          created_at: quiz.created_at
        });
        return;
      }
    }
  }, [topic]);

  const recordVideoViewed = useCallback(async () => {
    if (!user || !topic) return;

    try {
      // Call the server function to record and check for quiz
      const { data, error } = await supabase.rpc('record_topic_video_view', {
        p_user_id: user.id,
        p_topic: topic
      });

      if (error) {
        console.error('Error recording topic video view:', error);
        return;
      }

      if (data) {
        const result = data as { videos_watched: number; should_show_quiz: boolean; videos_until_quiz: number };
        setVideosWatched(result.videos_watched);
        
        if (result.should_show_quiz) {
          setShouldShowQuiz(true);
          await fetchTopicQuiz();
        }
      }
    } catch (err) {
      console.error('Error in recordVideoViewed:', err);
    }
  }, [user, topic, fetchTopicQuiz]);

  const completeCheckpoint = useCallback(async () => {
    if (!user || !topic) return;

    setShouldShowQuiz(false);
    setCheckpointQuiz(null);

    // Update last quiz timestamp
    await supabase
      .from('topic_quiz_progress')
      .update({ last_quiz_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('topic', topic);
  }, [user, topic]);

  const videosUntilQuiz = QUIZ_INTERVAL - (videosWatched % QUIZ_INTERVAL);

  return {
    shouldShowQuiz,
    checkpointQuiz,
    videosUntilQuiz,
    videosWatched,
    recordVideoViewed,
    completeCheckpoint,
  };
};
