import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, ChevronDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SearchFiltersProps {
  selectedDifficulty: string | null;
  onDifficultyChange: (difficulty: string | null) => void;
  sortBy: 'popular' | 'newest' | 'relevant';
  onSortChange: (sort: 'popular' | 'newest' | 'relevant') => void;
  className?: string;
}

export const SearchFilters = ({
  selectedDifficulty,
  onDifficultyChange,
  sortBy,
  onSortChange,
  className
}: SearchFiltersProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const difficulties = ['easy', 'medium', 'hard'];
  const sortOptions = [
    { value: 'popular', label: 'Most Popular' },
    { value: 'newest', label: 'Newest' },
    { value: 'relevant', label: 'Most Relevant' }
  ] as const;

  const activeFilters = [
    selectedDifficulty && `${selectedDifficulty.charAt(0).toUpperCase()}${selectedDifficulty.slice(1)}`,
  ].filter(Boolean);

  return (
    <div className={cn('space-y-2', className)}>
      {/* Filter Toggle Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsExpanded(!isExpanded)}
        className="gap-2"
      >
        <Filter className="w-4 h-4" />
        Filters
        {activeFilters.length > 0 && (
          <span className="px-1.5 py-0.5 text-xs rounded-full bg-primary text-primary-foreground">
            {activeFilters.length}
          </span>
        )}
        <ChevronDown className={cn(
          'w-4 h-4 transition-transform',
          isExpanded && 'rotate-180'
        )} />
      </Button>

      {/* Active Filters Pills */}
      {activeFilters.length > 0 && !isExpanded && (
        <div className="flex flex-wrap gap-2">
          {activeFilters.map((filter) => (
            <button
              key={filter}
              onClick={() => onDifficultyChange(null)}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-primary/20 text-primary hover:bg-primary/30 transition-colors"
            >
              {filter}
              <X className="w-3 h-3" />
            </button>
          ))}
        </div>
      )}

      {/* Expanded Filters */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50 space-y-4">
              {/* Difficulty Filter */}
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Difficulty
                </label>
                <div className="flex flex-wrap gap-2">
                  {difficulties.map((diff) => (
                    <button
                      key={diff}
                      onClick={() => onDifficultyChange(selectedDifficulty === diff ? null : diff)}
                      className={cn(
                        'px-3 py-1.5 text-sm rounded-full transition-colors',
                        selectedDifficulty === diff
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                      )}
                    >
                      {diff.charAt(0).toUpperCase() + diff.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort Filter */}
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Sort By
                </label>
                <div className="flex flex-wrap gap-2">
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => onSortChange(option.value)}
                      className={cn(
                        'px-3 py-1.5 text-sm rounded-full transition-colors',
                        sortBy === option.value
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clear All */}
              {activeFilters.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    onDifficultyChange(null);
                  }}
                  className="text-muted-foreground"
                >
                  Clear all filters
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
