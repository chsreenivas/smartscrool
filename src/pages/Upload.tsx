import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload as UploadIcon, Video, X, Loader2, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const categories = ['Science', 'History', 'Psychology', 'Money', 'Technology'];

const Upload = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'transcribing' | 'moderating' | 'done'>('idle');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      toast.error('Please select a video file');
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      toast.error('Video must be under 100MB');
      return;
    }

    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!user) {
      toast.error('Please sign in to upload');
      return;
    }

    if (!selectedFile || !title || !category) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsUploading(true);
    setUploadStatus('uploading');

    try {
      // Upload video to storage
      const fileName = `${user.id}/${Date.now()}_${selectedFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from('videos')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('videos')
        .getPublicUrl(fileName);

      // Create short record with pending moderation status
      const { data: shortData, error: insertError } = await supabase
        .from('shorts')
        .insert({
          user_id: user.id,
          title,
          description,
          video_url: publicUrl,
          category,
          is_approved: false, // Pending AI moderation
          moderation_status: 'pending',
        })
        .select('id')
        .single();

      if (insertError) throw insertError;

      // Step 1: Generate transcript
      setUploadStatus('transcribing');
      
      const { data: transcriptResult, error: transcriptError } = await supabase.functions.invoke('transcribe-video', {
        body: {
          shortId: shortData.id,
          title,
          description,
        }
      });

      const transcript = transcriptResult?.transcript || null;
      if (transcriptError) {
        console.warn('Transcription skipped:', transcriptError);
      }

      // Step 2: AI moderation with transcript
      setUploadStatus('moderating');
      
      const { data: moderationResult, error: moderationError } = await supabase.functions.invoke('moderate-video', {
        body: {
          short_id: shortData.id,
          title,
          description,
          transcript,
        }
      });

      if (moderationError) {
        console.error('Moderation error:', moderationError);
        toast.warning('Video uploaded! It will be reviewed by our team.');
      } else if (moderationResult?.is_approved) {
        toast.success('Video approved and published!');
      } else {
        toast.info('Video uploaded! It\'s being reviewed for educational content.');
      }

      setUploadStatus('done');
      navigate('/feed');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload video');
      setUploadStatus('idle');
    }

    setIsUploading(false);
  };

  const clearFile = () => {
    setSelectedFile(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

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
              <span className="text-sm text-muted-foreground">Max 100MB, educational content only</span>
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
            <label className="text-sm font-medium mb-2 block">Category *</label>
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

          <div className="pt-4">
            <Button
              onClick={handleUpload}
              disabled={isUploading || !selectedFile || !title || !category}
              className="w-full h-12 text-lg font-semibold bg-gradient-primary hover:opacity-90"
            >
              {isUploading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {uploadStatus === 'uploading' && 'Uploading video...'}
                  {uploadStatus === 'moderating' && 'AI reviewing content...'}
                  {uploadStatus === 'done' && 'Done!'}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <UploadIcon className="w-5 h-5" />
                  Upload Short
                </span>
              )}
            </Button>
          </div>

          {/* Educational content notice */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50 border border-border/50">
            <Shield className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <div className="text-xs text-muted-foreground">
              <p className="font-medium text-foreground mb-1">AI Content Review</p>
              <p>All uploads are automatically reviewed by AI to ensure educational value. Non-educational content will be flagged for review or rejected.</p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            By uploading, you confirm this content is educational and follows our guidelines.
          </p>
        </motion.div>
      </main>
    </div>
  );
};

export default Upload;
