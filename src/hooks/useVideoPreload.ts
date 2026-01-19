import { useEffect, useRef, useCallback } from 'react';

interface PreloadConfig {
  preloadCount?: number;
  currentIndex: number;
  videoUrls: string[];
}

export const useVideoPreload = ({ preloadCount = 2, currentIndex, videoUrls }: PreloadConfig) => {
  const preloadedVideos = useRef<Map<string, HTMLVideoElement>>(new Map());
  const preloadQueue = useRef<Set<string>>(new Set());

  const preloadVideo = useCallback((url: string) => {
    if (preloadedVideos.current.has(url) || preloadQueue.current.has(url)) return;
    
    preloadQueue.current.add(url);
    
    const video = document.createElement('video');
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;
    
    video.onloadeddata = () => {
      preloadedVideos.current.set(url, video);
      preloadQueue.current.delete(url);
    };
    
    video.onerror = () => {
      preloadQueue.current.delete(url);
    };
    
    video.src = url;
    video.load();
  }, []);

  const getPreloadedVideo = useCallback((url: string) => {
    return preloadedVideos.current.get(url);
  }, []);

  const cleanupOldVideos = useCallback((keepUrls: string[]) => {
    const keepSet = new Set(keepUrls);
    preloadedVideos.current.forEach((video, url) => {
      if (!keepSet.has(url)) {
        video.src = '';
        video.load();
        preloadedVideos.current.delete(url);
      }
    });
  }, []);

  useEffect(() => {
    // Preload next videos
    const urlsToPreload: string[] = [];
    
    for (let i = 1; i <= preloadCount; i++) {
      const nextIndex = currentIndex + i;
      if (nextIndex < videoUrls.length) {
        urlsToPreload.push(videoUrls[nextIndex]);
      }
    }
    
    // Also preload previous video for smooth backwards scroll
    if (currentIndex > 0) {
      urlsToPreload.push(videoUrls[currentIndex - 1]);
    }
    
    urlsToPreload.forEach(preloadVideo);
    
    // Cleanup videos that are too far away
    const nearbyUrls = videoUrls.slice(
      Math.max(0, currentIndex - 2),
      Math.min(videoUrls.length, currentIndex + preloadCount + 2)
    );
    cleanupOldVideos(nearbyUrls);
  }, [currentIndex, videoUrls, preloadCount, preloadVideo, cleanupOldVideos]);

  return { getPreloadedVideo, preloadVideo };
};
