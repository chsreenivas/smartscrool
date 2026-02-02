import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const subtopics: Record<string, string[]> = {
  'Math': ['Algebra', 'Geometry', 'Calculus', 'Statistics', 'Pre-Algebra', 'Trigonometry'],
  'Science': ['Physics', 'Chemistry', 'Biology', 'Earth Science', 'Environmental Science'],
  'History': ['Colonial America', 'Revolutionary War', 'Civil War', 'Constitution', 'Founding Fathers'],
  'Psychology': ['Cognitive', 'Social', 'Developmental', 'Behavioral', 'Personality'],
  'ELA': ['Reading Comprehension', 'Grammar', 'Writing', 'Vocabulary', 'Literature'],
  'Money': ['Budgeting', 'Investing', 'Credit', 'Taxes', 'Saving'],
  'Technology': ['Coding', 'Web Development', 'AI Basics', 'Digital Literacy', 'Cybersecurity'],
  'SAT Prep': ['Math Section', 'Reading Section', 'Writing Section', 'Test Strategies'],
  'Music': ['Guitar', 'Piano', 'Music Theory', 'Rhythm', 'Ear Training'],
  'Philosophy': ['Ethics', 'Logic', 'Metaphysics', 'Famous Philosophers', 'Thought Experiments'],
};

interface SubtopicSelectProps {
  category: string;
  value: string;
  onChange: (value: string) => void;
}

export const SubtopicSelect = ({ category, value, onChange }: SubtopicSelectProps) => {
  const availableSubtopics = subtopics[category] || [];

  // Reset subtopic when category changes
  useEffect(() => {
    if (category && !availableSubtopics.includes(value)) {
      onChange('');
    }
  }, [category, availableSubtopics, value, onChange]);

  if (!category || availableSubtopics.length === 0) {
    return null;
  }

  return (
    <div>
      <Label className="text-sm font-medium mb-2 block">Subtopic *</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a subtopic" />
        </SelectTrigger>
        <SelectContent>
          {availableSubtopics.map((subtopic) => (
            <SelectItem key={subtopic} value={subtopic}>
              {subtopic}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
