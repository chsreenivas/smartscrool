import { motion } from 'framer-motion';
import { Target, Video, HelpCircle, Zap, CheckCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface DailyGoalCardProps {
  goalType: 'videos' | 'quizzes' | 'xp' | 'subject';
  subject?: string | null;
  target: number;
  progress: number;
  completed: boolean;
  className?: string;
}

export const DailyGoalCard = ({ 
  goalType, 
  subject, 
  target, 
  progress, 
  completed,
  className 
}: DailyGoalCardProps) => {
  const getGoalConfig = () => {
    switch (goalType) {
      case 'videos':
        return { 
          icon: Video, 
          label: 'Watch videos', 
          color: 'text-blue-400',
          bgColor: 'bg-blue-500/20'
        };
      case 'quizzes':
        return { 
          icon: HelpCircle, 
          label: 'Complete quizzes', 
          color: 'text-purple-400',
          bgColor: 'bg-purple-500/20'
        };
      case 'xp':
        return { 
          icon: Zap, 
          label: 'Earn XP', 
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-500/20'
        };
      case 'subject':
        return { 
          icon: Target, 
          label: `${subject} videos`, 
          color: 'text-green-400',
          bgColor: 'bg-green-500/20'
        };
      default:
        return { 
          icon: Target, 
          label: 'Goal', 
          color: 'text-primary',
          bgColor: 'bg-primary/20'
        };
    }
  };

  const config = getGoalConfig();
  const Icon = config.icon;
  const percentage = Math.min((progress / target) * 100, 100);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'p-3 rounded-xl border backdrop-blur-sm',
        completed 
          ? 'bg-green-500/10 border-green-500/30' 
          : 'bg-card/50 border-border/50',
        className
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn('p-2 rounded-lg', config.bgColor)}>
          {completed ? (
            <CheckCircle className="w-5 h-5 text-green-400" />
          ) : (
            <Icon className={cn('w-5 h-5', config.color)} />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-foreground truncate">
              {config.label}
            </span>
            <span className={cn(
              'text-xs font-medium',
              completed ? 'text-green-400' : 'text-muted-foreground'
            )}>
              {progress}/{target}
            </span>
          </div>
          
          <Progress 
            value={percentage} 
            className={cn(
              'h-1.5',
              completed && '[&>div]:bg-green-500'
            )}
          />
        </div>
      </div>
    </motion.div>
  );
};
