import { useState, useRef, useCallback } from 'react';

interface CompressionProgress {
  stage: 'loading' | 'compressing' | 'done' | 'error';
  percent: number;
  message: string;
}

interface CompressionResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  savings: number;
}

export const useVideoCompression = () => {
  const [progress, setProgress] = useState<CompressionProgress | null>(null);
  const abortRef = useRef(false);

  const compressVideo = useCallback(async (inputFile: File): Promise<CompressionResult> => {
    abortRef.current = false;
    const originalSize = inputFile.size;

    // Skip compression for small files (under 3MB)
    if (originalSize < 3 * 1024 * 1024) {
      setProgress({ stage: 'done', percent: 100, message: 'File already small enough' });
      return { file: inputFile, originalSize, compressedSize: originalSize, savings: 0 };
    }

    try {
      setProgress({ stage: 'loading', percent: 0, message: 'Loading compressor...' });

      const { FFmpeg } = await import('@ffmpeg/ffmpeg');
      const { fetchFile } = await import('@ffmpeg/util');

      const ffmpeg = new FFmpeg();

      ffmpeg.on('progress', ({ progress: p }) => {
        if (abortRef.current) return;
        const pct = Math.min(Math.round(p * 100), 99);
        setProgress({ stage: 'compressing', percent: pct, message: `Compressing... ${pct}%` });
      });

      // Load FFmpeg WASM from CDN
      await ffmpeg.load({
        coreURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js',
        wasmURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.wasm',
      });

      setProgress({ stage: 'compressing', percent: 5, message: 'Preparing video...' });

      const inputName = 'input' + getExtension(inputFile.name);
      const outputName = 'output.mp4';

      await ffmpeg.writeFile(inputName, await fetchFile(inputFile));

      // Calculate target bitrate for ~6MB output
      // Get video duration estimate (assume 60s max for shorts)
      const videoDuration = await getVideoDuration(inputFile);
      const targetSizeBytes = 6 * 1024 * 1024; // 6MB
      const targetBitrateKbps = Math.max(
        500,
        Math.floor((targetSizeBytes * 8) / (videoDuration * 1000))
      );

      // FFmpeg args: scale to 720p max, H.264, optimized for web
      await ffmpeg.exec([
        '-i', inputName,
        '-vf', 'scale=-2:\'min(720,ih)\'',
        '-c:v', 'libx264',
        '-preset', 'fast',
        '-b:v', `${targetBitrateKbps}k`,
        '-maxrate', `${Math.floor(targetBitrateKbps * 1.5)}k`,
        '-bufsize', `${targetBitrateKbps * 2}k`,
        '-c:a', 'aac',
        '-b:a', '128k',
        '-movflags', '+faststart',
        '-pix_fmt', 'yuv420p',
        '-y',
        outputName,
      ]);

      const outputData = await ffmpeg.readFile(outputName);
      const compressedBlob = new Blob([outputData], { type: 'video/mp4' });
      const compressedSize = compressedBlob.size;

      // If compression made the file bigger, use original
      if (compressedSize >= originalSize) {
        setProgress({ stage: 'done', percent: 100, message: 'Original is already optimal' });
        await ffmpeg.terminate();
        return { file: inputFile, originalSize, compressedSize: originalSize, savings: 0 };
      }

      const compressedFile = new File(
        [compressedBlob],
        inputFile.name.replace(/\.[^.]+$/, '.mp4'),
        { type: 'video/mp4' }
      );

      const savings = Math.round((1 - compressedSize / originalSize) * 100);
      setProgress({ stage: 'done', percent: 100, message: `Compressed! Saved ${savings}%` });

      await ffmpeg.terminate();

      return { file: compressedFile, originalSize, compressedSize, savings };
    } catch (error: any) {
      console.error('Video compression failed:', error);
      setProgress({ stage: 'error', percent: 0, message: 'Compression failed, using original' });
      // Fallback: return original file so upload still works
      return { file: inputFile, originalSize, compressedSize: originalSize, savings: 0 };
    }
  }, []);

  const resetProgress = useCallback(() => setProgress(null), []);

  return { compressVideo, progress, resetProgress };
};

function getExtension(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (ext === 'mov') return '.mov';
  if (ext === 'webm') return '.webm';
  return '.mp4';
}

function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      const duration = video.duration || 60;
      URL.revokeObjectURL(video.src);
      resolve(duration);
    };
    video.onerror = () => resolve(60); // fallback
    video.src = URL.createObjectURL(file);
  });
}
