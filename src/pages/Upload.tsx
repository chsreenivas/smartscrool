import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload as UploadIcon, Video, X, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { SubtopicSelect } from '@/components/SubtopicSelect';

const categories = ['Math', 'Science', 'History', 'Psychology', 'ELA', 'Money', 'Technology', 'SAT Prep', 'Music', 'Philosophy'];

// Allowed video types
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'];
const MIN_DURATION = 15; // seconds
const MAX_DURATION = 120; // seconds
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

interface VideoValidation {
  isValid: boolean;
  hasAudio: boolean;
  duration: number;
  error?: string;
}

const Upload = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [subtopic, setSubtopic] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [videoValidation, setVideoValidation] = useState<VideoValidation | null>(null);

  const validateVideo = (file: File): Promise<VideoValidation> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';

      video.onloadedmetadata = () => {
        const duration = video.duration;
        
        // Check for audio tracks
        const hasAudio = (video as any).mozHasAudio || 
                        Boolean((video as any).webkitAudioDecodedByteCount) ||
                        Boolean((video as any).audioTracks?.length);
        
        // For browsers that don't support audio detection, we'll assume audio is present
        // and rely on the video element's audio track detection
        const audioCheck = hasAudio !== false;
        
        URL.revokeObjectURL(video.src);

        if (duration < MIN_DURATION) {
          resolve({
            isValid: false,
            hasAudio: audioCheck,
            duration,
            error: `Video must be at least ${MIN_DURATION} seconds (current: ${Math.round(duration)}s)`
          });
          return;
        }

        if (duration > MAX_DURATION) {
          resolve({
            isValid: false,
            hasAudio: audioCheck,
            duration,
            error: `Video must be under ${MAX_DURATION} seconds (current: ${Math.round(duration)}s)`
          });
          return;
        }

        resolve({
          isValid: true,
          hasAudio: audioCheck,
          duration
        });
      };

      video.onerror = () => {
        URL.revokeObjectURL(video.src);
        resolve({
          isValid: false,
          hasAudio: false,
          duration: 0,
          error: 'Could not read video file. Please try a different format.'
        });
      };

      video.src = URL.createObjectURL(file);
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
      toast.error('Please select a valid video file (MP4, MOV, or WebM)');
      return;
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      toast.error('Video must be under 100MB');
      return;
    }

    setIsValidating(true);
    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));

    // Validate video properties
    const validation = await validateVideo(file);
    setVideoValidation(validation);
    setIsValidating(false);

    if (!validation.isValid) {
      toast.error(validation.error);
    }
  };

  const createDatabaseRecord = async (publicUrl: string, retryCount = 0): Promise<boolean> => {
    const maxRetries = 3;
    
    try {
      const { error: insertError } = await supabase
        .from('shorts')
        .insert({
          user_id: user!.id,
          title,
          description,
          video_url: publicUrl,
          category,
          subtopic,
          is_approved: true,
          is_educational: true,
          moderation_status: 'approved',
          created_at: new Date().toISOString(),
        });

      if (insertError) {
        if (retryCount < maxRetries) {
          console.log(`DB write failed, retrying (${retryCount + 1}/${maxRetries})...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
          return createDatabaseRecord(publicUrl, retryCount + 1);
        }
        throw insertError;
      }
      
      return true;
    } catch (error) {
      if (retryCount < maxRetries) {
        console.log(`DB write error, retrying (${retryCount + 1}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return createDatabaseRecord(publicUrl, retryCount + 1);
      }
      throw error;
    }
  };

  const handleUpload = async () => {
    if (!user) {
      toast.error('Please sign in to upload');
      return;
    }

    if (!selectedFile || !title || !category || !subtopic) {
      toast.error('Please fill in all required fields including subtopic');
      return;
    }

    if (!videoValidation?.isValid) {
      toast.error('Please select a valid video that meets the requirements');
      return;
    }

    setIsUploading(true);

    let publicUrl: string | null = null;

    try {
      // STEP 1: Upload video to PUBLIC storage bucket
      const fileName = `${user.id}/${Date.now()}_${selectedFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from('videos')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // STEP 2: Generate PUBLIC URL immediately after upload
      const { data: urlData } = supabase.storage
        .from('videos')
        .getPublicUrl(fileName);
      
      publicUrl = urlData.publicUrl;

      if (!publicUrl) {
        throw new Error('Failed to generate public URL for video');
      }

      // STEP 3: Create database record with retry logic
      // CRITICAL: This MUST succeed before showing success to user
      // NEVER delete the file if this fails - just retry
      await createDatabaseRecord(publicUrl);

      // STEP 4: Success - navigate to feed
      toast.success('Video published successfully! 🎉');
      navigate('/feed');
    } catch (error: any) {
      console.error('Upload error:', error);
      
      // If we have a public URL but DB write failed after retries,
      // inform user but DO NOT delete the uploaded file
      if (publicUrl) {
        toast.error('Video uploaded but failed to publish. Please try again or contact support.');
      } else {
        toast.error(error.message || 'Failed to upload video');
      }
    }

    setIsUploading(false);
  };

  const clearFile = () => {
    setSelectedFile(null);
    setPreview(null);
    setVideoValidation(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isFormValid = selectedFile && title && category && subtopic && videoValidation?.isValid;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-30 px-4 py-3 flex items-center gap-4 bg-background/80 backdrop-blur-md border-b border-border/50">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="font-display text-lg font-bold">Upload Short</h1>
      </header>

      <main className="pt-20 pb-8 px-4 max-w-md mx-auto">
        {/* Video Upload Area */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {!preview ? (
            <label
              className="flex flex-col items-center justify-center w-full h-64 rounded-2xl border-2 border-dashed border-border bg-secondary/30 cursor-pointer hover:bg-secondary/50 transition-colors"
            >
              <Video className="w-12 h-12 text-muted-foreground mb-4" />
              <span className="text-lg font-medium mb-1">Upload Video</span>
              <span className="text-sm text-muted-foreground text-center px-4">
                MP4, MOV, or WebM • 15-120 seconds • Max 100MB
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/quicktime,video/webm"
                className="hidden"
                onChange={handleFileSelect}
              />
            </label>
          ) : (
            <div className="relative w-full h-64 rounded-2xl overflow-hidden bg-black">
              <video
                src={preview}
                className="w-full h-full object-cover"
                controls
              />
              <button
                onClick={clearFile}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center"
              >
                <X className="w-5 h-5 text-white" />
              </button>
              
              {/* Validation status badge */}
              {isValidating && (
                <div className="absolute bottom-2 left-2 px-3 py-1 rounded-full bg-black/70 text-white text-sm flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Validating...
                </div>
              )}
              {videoValidation && !isValidating && (
                <div className={`absolute bottom-2 left-2 px-3 py-1 rounded-full text-white text-sm flex items-center gap-2 ${
                  videoValidation.isValid ? 'bg-green-600/90' : 'bg-red-600/90'
                }`}>
                  {videoValidation.isValid ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      {Math.round(videoValidation.duration)}s
                    </>
                  ) : (
                    videoValidation.error
                  )}
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Form */}
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div>
            <label className="text-sm font-medium mb-2 block">Title *</label>
            <Input
              placeholder="What will viewers learn?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Description</label>
            <Textarea
              placeholder="Add more context..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={500}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Subject *</label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    category === cat
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Subtopic */}
          <SubtopicSelect
            category={category}
            value={subtopic}
            onChange={setSubtopic}
          />

          <div className="pt-4">
            <Button
              onClick={handleUpload}
              disabled={isUploading || !isFormValid}
              className="w-full h-12 text-lg font-semibold bg-gradient-primary hover:opacity-90"
            >
              {isUploading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Publishing...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <UploadIcon className="w-5 h-5" />
                  Publish Now
                </span>
              )}
            </Button>
          </div>

          {/* Requirements notice */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50 border border-border/50">
            <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <div className="text-xs text-muted-foreground">
              <p className="font-medium text-foreground mb-1">Instant Publishing</p>
              <p>Your video will be published immediately to your profile and the {category || 'selected'} feed.</p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            By uploading, you confirm this content follows our community guidelines.
          </p>
        </motion.div>
      </main>
    </div>
  );
};

export default Upload;
