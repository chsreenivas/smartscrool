import { useState, useRef } from 'react';
import { Camera, Loader2, ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB for banners

interface BannerImageUploadProps {
  userId: string;
  currentBannerUrl: string | null;
  onUploadComplete: (url: string) => void;
  editable?: boolean;
}

export const BannerImageUpload = ({
  userId,
  currentBannerUrl,
  onUploadComplete,
  editable = true,
}: BannerImageUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast.error('Please select a JPG, PNG, or WebP image');
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast.error('Banner image must be under 10MB');
      return;
    }

    setIsUploading(true);
    setPreviewUrl(URL.createObjectURL(file));

    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/banner_${Date.now()}.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('banners')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('banners')
        .getPublicUrl(fileName);

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ banner_url: publicUrl })
        .eq('id', userId);

      if (updateError) throw updateError;

      onUploadComplete(publicUrl);
      toast.success('Banner updated!');
    } catch (error: any) {
      console.error('Banner upload error:', error);
      toast.error(error.message || 'Failed to upload banner');
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
    }
  };

  const displayUrl = previewUrl || currentBannerUrl;

  return (
    <div className="relative w-full group">
      {/* Banner container with 16:9 aspect on desktop, taller on mobile */}
      <div className="relative w-full h-32 sm:h-40 md:h-48 overflow-hidden bg-gradient-to-br from-primary/20 to-secondary">
        {displayUrl ? (
          <img
            src={displayUrl}
            alt="Profile banner"
            className="w-full h-full object-cover object-center"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-12 h-12 text-muted-foreground/30" />
          </div>
        )}

        {/* Upload overlay */}
        {editable && (
          <>
            {isUploading ? (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-white" />
              </div>
            ) : (
              <div
                className="absolute inset-0 bg-black/0 group-hover:bg-black/40 flex items-center justify-center transition-all cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 text-white bg-black/50 px-4 py-2 rounded-full">
                  <Camera className="w-5 h-5" />
                  <span className="text-sm font-medium">Change Banner</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileSelect}
        disabled={isUploading}
      />
    </div>
  );
};
