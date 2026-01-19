import { useRef, useCallback, useEffect, useState } from 'react';

interface SwipeConfig {
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
  enabled?: boolean;
}

interface SwipeState {
  isScrolling: boolean;
  direction: 'up' | 'down' | null;
  progress: number;
}

export const useSwipeGesture = ({
  onSwipeUp,
  onSwipeDown,
  threshold = 50,
  enabled = true
}: SwipeConfig) => {
  const touchStartY = useRef(0);
  const touchStartTime = useRef(0);
  const isScrolling = useRef(false);
  const [swipeState, setSwipeState] = useState<SwipeState>({
    isScrolling: false,
    direction: null,
    progress: 0
  });

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enabled) return;
    touchStartY.current = e.touches[0].clientY;
    touchStartTime.current = Date.now();
    setSwipeState({ isScrolling: true, direction: null, progress: 0 });
  }, [enabled]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!enabled) return;
    const currentY = e.touches[0].clientY;
    const diff = touchStartY.current - currentY;
    const progress = Math.min(Math.abs(diff) / threshold, 1);
    const direction = diff > 0 ? 'up' : 'down';
    
    setSwipeState({ isScrolling: true, direction, progress });
  }, [enabled, threshold]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!enabled || isScrolling.current) return;
    
    const touchEndY = e.changedTouches[0].clientY;
    const diff = touchStartY.current - touchEndY;
    const timeDiff = Date.now() - touchStartTime.current;
    
    // Velocity-based detection for quick swipes
    const velocity = Math.abs(diff) / timeDiff;
    const isQuickSwipe = velocity > 0.5 && Math.abs(diff) > 20;
    
    if (Math.abs(diff) > threshold || isQuickSwipe) {
      isScrolling.current = true;
      
      if (diff > 0 && onSwipeUp) {
        onSwipeUp();
      } else if (diff < 0 && onSwipeDown) {
        onSwipeDown();
      }
      
      setTimeout(() => {
        isScrolling.current = false;
      }, 400);
    }
    
    setSwipeState({ isScrolling: false, direction: null, progress: 0 });
  }, [enabled, threshold, onSwipeUp, onSwipeDown]);

  const handleWheel = useCallback((e: WheelEvent) => {
    if (!enabled || isScrolling.current) return;
    e.preventDefault();
    
    if (Math.abs(e.deltaY) > 30) {
      isScrolling.current = true;
      
      if (e.deltaY > 0 && onSwipeUp) {
        onSwipeUp();
      } else if (e.deltaY < 0 && onSwipeDown) {
        onSwipeDown();
      }
      
      setTimeout(() => {
        isScrolling.current = false;
      }, 400);
    }
  }, [enabled, onSwipeUp, onSwipeDown]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled || isScrolling.current) return;
    
    if (e.key === 'ArrowDown' || e.key === ' ' || e.key === 'j') {
      e.preventDefault();
      isScrolling.current = true;
      onSwipeUp?.();
      setTimeout(() => { isScrolling.current = false; }, 400);
    } else if (e.key === 'ArrowUp' || e.key === 'k') {
      e.preventDefault();
      isScrolling.current = true;
      onSwipeDown?.();
      setTimeout(() => { isScrolling.current = false; }, 400);
    }
  }, [enabled, onSwipeUp, onSwipeDown]);

  const bindToElement = useCallback((element: HTMLElement | null) => {
    if (!element) return () => {};
    
    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });
    element.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, handleWheel, handleKeyDown]);

  return { swipeState, bindToElement };
};
