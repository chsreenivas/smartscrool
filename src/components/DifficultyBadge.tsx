import { cn } from '@/lib/utils';
import { Zap, Target, Brain } from 'lucide-react';

interface DifficultyBadgeProps {
  level: 'easy' | 'medium' | 'hard';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const DifficultyBadge = ({ level, className, size = 'md' }: DifficultyBadgeProps) => {
  const config = {
    easy: { 
      icon: Zap, 
      label: 'Easy', 
      color: 'text-green-400 bg-green-500/20 border-green-500/30' 
    },
    medium: { 
      icon: Target, 
      label: 'Medium', 
      color: 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30' 
    },
    hard: { 
      icon: Brain, 
      label: 'Hard', 
      color: 'text-red-400 bg-red-500/20 border-red-500/30' 
    }
  };

  const { icon: Icon, label, color } = config[level];

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5 gap-1',
    md: 'text-sm px-2 py-1 gap-1.5',
    lg: 'text-base px-3 py-1.5 gap-2'
  };

  const iconSizes = {
    sm: 10,
    md: 12,
    lg: 14
  };

  return (
    <div 
      className={cn(
        'inline-flex items-center rounded-full font-medium border backdrop-blur-sm',
        color,
        sizeClasses[size],
        className
      )}
    >
      <Icon size={iconSizes[size]} />
      <span>{label}</span>
    </div>
  );
};
