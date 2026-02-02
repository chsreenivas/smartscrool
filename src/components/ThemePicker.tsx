import { motion } from 'framer-motion';
import { Sun, Moon, Sparkles, Trees } from 'lucide-react';
import { Theme } from '@/types/content';

interface ThemePickerProps {
  currentTheme: Theme;
  onThemeChange: (theme: Theme) => void;
}

const themes: { id: Theme; icon: React.ReactNode; label: string }[] = [
  { id: 'light', icon: <Sun className="w-5 h-5" />, label: 'Light' },
  { id: 'dark', icon: <Moon className="w-5 h-5" />, label: 'Dark' },
  { id: 'neon', icon: <Sparkles className="w-5 h-5" />, label: 'Neon' },
  { id: 'safari', icon: <Trees className="w-5 h-5" />, label: 'Safari' },
];

export const ThemePicker = ({ currentTheme, onThemeChange }: ThemePickerProps) => {
  return (
    <div className="flex items-center gap-1 p-1 rounded-full bg-secondary/80 backdrop-blur-sm">
      {themes.map((theme) => (
        <motion.button
          key={theme.id}
          onClick={() => onThemeChange(theme.id)}
          className={`relative flex items-center justify-center w-10 h-10 rounded-full transition-colors ${
            currentTheme === theme.id
              ? 'text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {currentTheme === theme.id && (
            <motion.div
              layoutId="activeTheme"
              className="absolute inset-0 bg-gradient-primary rounded-full"
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
          )}
          <span className="relative z-10">{theme.icon}</span>
        </motion.button>
      ))}
    </div>
  );
};
