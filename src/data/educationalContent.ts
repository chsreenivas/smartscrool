import { ContentCard, QuizCard } from '@/types/content';

const categories = ['Science', 'History', 'Space', 'Nature', 'Tech', 'Psychology', 'Art', 'Geography'];
const emojis: Record<string, string> = {
  Science: '🔬',
  History: '📜',
  Space: '🚀',
  Nature: '🌿',
  Tech: '💻',
  Psychology: '🧠',
  Art: '🎨',
  Geography: '🌍',
};

export const educationalFacts: ContentCard[] = [
  {
    id: 1,
    type: 'fact',
    category: 'Space',
    emoji: '🚀',
    title: 'The Sun\'s Light Travel Time',
    content: 'It takes sunlight approximately 8 minutes and 20 seconds to travel from the Sun to Earth. This means when you look at the Sun, you\'re actually seeing it as it was over 8 minutes ago!',
    source: 'NASA',
  },
  {
    id: 2,
    type: 'fact',
    category: 'Psychology',
    emoji: '🧠',
    title: 'The Doorway Effect',
    content: 'Ever walk into a room and forget why you went there? This is called the "doorway effect" – our brains use doorways as event boundaries, causing us to forget our previous intentions.',
    source: 'University of Notre Dame',
  },
  {
    id: 3,
    type: 'fact',
    category: 'Nature',
    emoji: '🌿',
    title: 'Trees Communicate Underground',
    content: 'Trees communicate and share nutrients through an underground network of fungi called the "Wood Wide Web." Mother trees can recognize their offspring and send them extra resources.',
    source: 'Suzanne Simard Research',
  },
  {
    id: 4,
    type: 'fact',
    category: 'History',
    emoji: '📜',
    title: 'Cleopatra & The Pyramids',
    content: 'Cleopatra lived closer in time to the Moon landing than to the construction of the Great Pyramid of Giza. The pyramids were built around 2560 BCE, while Cleopatra lived around 30 BCE.',
    source: 'Historical Timeline',
  },
  {
    id: 5,
    type: 'fact',
    category: 'Tech',
    emoji: '💻',
    title: 'The First Computer Bug',
    content: 'The term "computer bug" originated in 1947 when Grace Hopper found an actual moth stuck in a Harvard Mark II computer. The moth was taped into the logbook with the note "first actual case of bug being found."',
    source: 'Smithsonian',
  },
  {
    id: 6,
    type: 'fact',
    category: 'Science',
    emoji: '🔬',
    title: 'Your Body Has More Bacterial Cells',
    content: 'Your body contains roughly 38 trillion bacterial cells compared to about 30 trillion human cells. These bacteria are essential for digestion, immunity, and even mood regulation.',
    source: 'NIH Research',
  },
  {
    id: 7,
    type: 'fact',
    category: 'Geography',
    emoji: '🌍',
    title: 'Russia Spans 11 Time Zones',
    content: 'Russia is so vast that it spans 11 different time zones – more than any other country. When it\'s midnight in Kaliningrad, it\'s already 10 AM the next day in Kamchatka.',
    source: 'World Atlas',
  },
  {
    id: 8,
    type: 'fact',
    category: 'Art',
    emoji: '🎨',
    title: 'The Mona Lisa Has No Eyebrows',
    content: 'The Mona Lisa originally had eyebrows, but they\'ve faded over 500 years due to deterioration and overzealous cleaning. High-resolution scans in 2007 confirmed their original existence.',
    source: 'Louvre Museum',
  },
  {
    id: 9,
    type: 'fact',
    category: 'Space',
    emoji: '🚀',
    title: 'A Day on Venus',
    content: 'A day on Venus (one complete rotation) is longer than its year (one orbit around the Sun). Venus takes 243 Earth days to rotate once but only 225 Earth days to orbit the Sun.',
    source: 'NASA',
  },
  {
    id: 10,
    type: 'fact',
    category: 'Psychology',
    emoji: '🧠',
    title: 'The Baader-Meinhof Phenomenon',
    content: 'When you learn something new and suddenly see it everywhere, that\'s called the Baader-Meinhof Phenomenon or frequency illusion. Your brain is now primed to notice what it previously ignored.',
    source: 'Cognitive Science',
  },
];

export const quizzes: QuizCard[] = [
  {
    id: 101,
    type: 'quiz',
    category: 'Space',
    emoji: '🚀',
    title: 'Quiz Time!',
    content: 'Test your knowledge about what you just learned.',
    question: 'How long does it take sunlight to reach Earth?',
    options: ['4 minutes', '8 minutes', '15 minutes', '1 hour'],
    correctAnswer: 1,
    explanation: 'Sunlight takes approximately 8 minutes and 20 seconds to travel the 93 million miles from the Sun to Earth.',
  },
  {
    id: 102,
    type: 'quiz',
    category: 'Psychology',
    emoji: '🧠',
    title: 'Quiz Time!',
    content: 'Test your knowledge about the brain.',
    question: 'What is the phenomenon called when you forget why you walked into a room?',
    options: ['Memory slip', 'The doorway effect', 'Brain freeze', 'Cognitive drift'],
    correctAnswer: 1,
    explanation: 'The doorway effect occurs because our brains use physical boundaries like doorways as event boundaries, causing a reset in our working memory.',
  },
  {
    id: 103,
    type: 'quiz',
    category: 'Nature',
    emoji: '🌿',
    title: 'Quiz Time!',
    content: 'Test your knowledge about nature.',
    question: 'What is the underground network that trees use to communicate called?',
    options: ['Tree Talk', 'Root Radio', 'Wood Wide Web', 'Forest Net'],
    correctAnswer: 2,
    explanation: 'The "Wood Wide Web" is a network of mycorrhizal fungi that connects trees and allows them to share nutrients and chemical signals.',
  },
];

export const generateContent = (): ContentCard[] => {
  const content: ContentCard[] = [];
  let quizIndex = 0;
  
  for (let i = 0; i < educationalFacts.length; i++) {
    content.push({ ...educationalFacts[i], id: i + 1 });
    
    // Add quiz every 10 facts
    if ((i + 1) % 10 === 0 && quizIndex < quizzes.length) {
      content.push({ ...quizzes[quizIndex], id: 100 + quizIndex + 1 });
      quizIndex++;
    }
  }
  
  return content;
};
