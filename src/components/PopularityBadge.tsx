import { Eye, TrendingUp, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PopularityBadgeProps {
  viewCount: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const PopularityBadge = ({ viewCount, className, size = 'md' }: PopularityBadgeProps) => {
  const getPopularityLevel = () => {
    if (viewCount >= 1000) return { icon: Flame, label: 'Hot', color: 'text-orange-400 bg-orange-500/20' };
    if (viewCount >= 500) return { icon: TrendingUp, label: 'Trending', color: 'text-yellow-400 bg-yellow-500/20' };
    if (viewCount >= 100) return { icon: Eye, label: 'Popular', color: 'text-blue-400 bg-blue-500/20' };
    return null;
  };

  const popularity = getPopularityLevel();
  if (!popularity) return null;

  const Icon = popularity.icon;
  
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5 gap-1',
    md: 'text-sm px-2 py-1 gap-1.5',
    lg: 'text-base px-3 py-1.5 gap-2'
  };

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16
  };

  const formatCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  return (
    <div 
      className={cn(
        'inline-flex items-center rounded-full font-medium backdrop-blur-sm',
        popularity.color,
        sizeClasses[size],
        className
      )}
    >
      <Icon size={iconSizes[size]} />
      <span>{popularity.label}: {formatCount(viewCount)} views</span>
    </div>
  );
};
