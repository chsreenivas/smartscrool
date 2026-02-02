export type Theme = 'light' | 'dark' | 'neon' | 'safari';

export interface EducationalCard {
  id: number;
  type: 'fact' | 'quiz';
  category: string;
  title: string;
  content: string;
  emoji: string;
  source?: string;
}

export interface QuizCard extends EducationalCard {
  type: 'quiz';
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export type ContentCard = EducationalCard | QuizCard;

export interface UserProgress {
  cardsViewed: number;
  correctAnswers: number;
  totalQuizzes: number;
  streak: number;
}
