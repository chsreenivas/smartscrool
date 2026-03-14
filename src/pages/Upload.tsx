import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload as UploadIcon, Video, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { SubtopicSelect } from '@/components/SubtopicSelect';
import { useVideoCompression } from '@/hooks/useVideoCompression';

const categories = ['Math', 'Science', 'History', 'Psychology', 'ELA', 'Money', 'Technology', 'SAT Prep', 'Music', 'Philosophy'];

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
  const uploadInProgress = useRef(false);
  const { compressVideo, progress: compressionProgress, resetProgress } = useVideoCompression();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Basic validation only
    if (!file.type.startsWith('video/')) {
      toast.error('Please select a video file');
      return;
    }

    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    // Prevent double uploads
    if (uploadInProgress.current || isUploading) {
      return;
    }

    if (!user) {
      toast.error('Please sign in to upload');
      return;
    }

    if (!selectedFile || !title || !category || !subtopic) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsUploading(true);
    uploadInProgress.current = true;

    try {
      // STEP 0: Compress video before upload
      toast.info('Compressing video for optimal playback...');
      const { file: fileToUpload } = await compressVideo(selectedFile);

      const fileName = `${user.id}/${Date.now()}_${fileToUpload.name}`;
      let uploadedFilePath: string | null = null;

      // STEP 1: Upload compressed file to storage bucket
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('videos')
        .upload(fileName, fileToUpload);

      if (uploadError) {
        throw new Error(`Storage upload failed: ${uploadError.message}`);
      }

      uploadedFilePath = fileName;

      // STEP 2: Get public URL and verify it exists
      const { data: urlData } = supabase.storage
        .from('videos')
        .getPublicUrl(fileName);

      const videoUrl = urlData.publicUrl;

      if (!videoUrl) {
        throw new Error('Failed to generate public URL');
      }

      // STEP 3: INSERT into database - this MUST succeed
      // Videos require moderation before appearing in feeds
      const { data: insertedShort, error: dbError } = await supabase
        .from('shorts')
        .insert({
          user_id: user.id,
          title,
          description,
          video_url: videoUrl,
          category,
          subtopic,
          is_approved: false // Requires moderation before going live
        })
        .select('id')
        .single();

      if (dbError || !insertedShort) {
        // FAILSAFE: Delete the uploaded file if DB insert fails
        if (uploadedFilePath) {
          await supabase.storage
            .from('videos')
            .remove([uploadedFilePath]);
        }
        throw new Error(`Database insert failed: ${dbError?.message}`);
      }

      // STEP 4: Auto-generate quiz and summary in background (fire-and-forget)
      const shortId = insertedShort.id;
      const generateContent = async (type: 'quiz' | 'summary') => {
        try {
          await supabase.functions.invoke('ai-generate', {
            body: { type, shortId, title, description, transcript: null },
          });
        } catch (e) {
          console.warn(`Auto-generate ${type} failed (non-blocking):`, e);
        }
      };
      // Don't await — let these run in the background
      generateContent('quiz');
      generateContent('summary');

      // STEP 5: SUCCESS - only now show success message
      toast.success('Video uploaded! Quiz & summary are being generated automatically. 🎉');
      navigate('/profile');

    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
      uploadInProgress.current = false;
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isFormValid = selectedFile && title && category && subtopic;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-30 px-4 py-3 flex items-center gap-4 bg-background/80 backdrop-blur-md border-b border-border/50">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="font-display text-lg font-bold">Upload Video</h1>
      </header>

      <main className="pt-20 pb-8 px-4 max-w-md mx-auto">
        {/* Video Upload Area */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {!preview ? (
            <label className="flex flex-col items-center justify-center w-full h-64 rounded-2xl border-2 border-dashed border-border bg-secondary/30 cursor-pointer hover:bg-secondary/50 transition-colors">
              <Video className="w-12 h-12 text-muted-foreground mb-4" />
              <span className="text-lg font-medium mb-1">Select Video</span>
              <span className="text-sm text-muted-foreground">MP4, MOV, or WebM</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
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
                playsInline
              />
              <button
                onClick={clearFile}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center"
              >
                <X className="w-5 h-5 text-white" />
              </button>
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
              disabled={isUploading || !isFormValid || uploadInProgress.current}
              className="w-full h-12 text-lg font-semibold bg-gradient-primary hover:opacity-90"
            >
              {isUploading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Uploading...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <UploadIcon className="w-5 h-5" />
                  Upload
                </span>
              )}
            </Button>
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
