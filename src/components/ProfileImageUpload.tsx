import { useState, useRef } from 'react';
import { Camera, Loader2, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

interface ProfileImageUploadProps {
  userId: string;
  currentImageUrl: string | null;
  onUploadComplete: (url: string) => void;
  size?: 'sm' | 'md' | 'lg';
  fallbackLetter?: string;
}

export const ProfileImageUpload = ({
  userId,
  currentImageUrl,
  onUploadComplete,
  size = 'lg',
  fallbackLetter = '?',
}: ProfileImageUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

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
      toast.error('Image must be under 5MB');
      return;
    }

    setIsUploading(true);
    setPreviewUrl(URL.createObjectURL(file));

    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/avatar_${Date.now()}.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', userId);

      if (updateError) throw updateError;

      onUploadComplete(publicUrl);
      toast.success('Profile picture updated!');
    } catch (error: any) {
      console.error('Avatar upload error:', error);
      toast.error(error.message || 'Failed to upload image');
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
    }
  };

  const displayUrl = previewUrl || currentImageUrl;

  return (
    <div className="relative group">
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className={cn(
          sizeClasses[size],
          'rounded-full bg-gradient-primary flex items-center justify-center ring-4 ring-background overflow-hidden transition-all hover:ring-primary/50',
          isUploading && 'opacity-70'
        )}
      >
        {isUploading ? (
          <Loader2 className={cn(iconSizes[size], 'animate-spin text-primary-foreground')} />
        ) : displayUrl ? (
          <img
            src={displayUrl}
            alt="Profile"
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-4xl font-bold text-primary-foreground">
            {fallbackLetter.toUpperCase()}
          </span>
        )}
      </button>

      {/* Camera overlay */}
      <div
        className={cn(
          'absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer',
          isUploading && 'opacity-0'
        )}
        onClick={() => fileInputRef.current?.click()}
      >
        <Camera className="w-6 h-6 text-white" />
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
