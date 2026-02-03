import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Video, UserPlus, UserMinus, Loader2, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useCreatorProfile } from '@/hooks/useCreatorProfile';
import { CreatorVideoGrid } from '@/components/CreatorVideoGrid';
import { toast } from 'sonner';

const CreatorProfile = () => {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const {
    profile,
    videos,
    followerCount,
    followingCount,
    videoCount,
    isFollowing,
    loading,
    toggleFollow,
  } = useCreatorProfile(userId || '');

  const isOwnProfile = user?.id === userId;

  const handleFollowToggle = async () => {
    if (!user) {
      toast.error('Please sign in to follow creators');
      navigate('/auth');
      return;
    }
    await toggleFollow();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-bold mb-2">Creator not found</h1>
          <Button onClick={() => navigate('/feed')} variant="outline">
            Back to Feed
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-30 px-4 py-3 flex items-center gap-4 bg-background/80 backdrop-blur-md border-b border-border/50">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="font-display text-lg font-bold">
          {profile.username || 'Creator'}
        </h1>
      </header>

      {/* Banner */}
      <div className="pt-14">
        <div className="relative w-full h-32 sm:h-40 md:h-48 overflow-hidden bg-gradient-to-br from-primary/20 to-secondary">
          {profile.banner_url ? (
            <img
              src={profile.banner_url}
              alt="Profile banner"
              className="w-full h-full object-cover object-center"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="w-12 h-12 text-muted-foreground/30" />
            </div>
          )}
        </div>
      </div>

      <main className="pb-8 px-4 max-w-lg mx-auto -mt-12 relative z-10">
        {/* Profile Header */}
        <motion.div
          className="flex flex-col items-center mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Avatar */}
          <div className="w-24 h-24 rounded-full bg-gradient-primary flex items-center justify-center ring-4 ring-background overflow-hidden">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.username || 'Creator'}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-4xl font-bold text-primary-foreground">
                {profile.username?.[0]?.toUpperCase() || '?'}
              </span>
            )}
          </div>

          {/* Username */}
          <h2 className="text-2xl font-bold mb-1 mt-4">{profile.username || 'Creator'}</h2>
          
          {/* Bio */}
          {profile.bio && (
            <p className="text-muted-foreground text-center mb-4 max-w-xs">
              {profile.bio}
            </p>
          )}

          {/* Stats */}
          <div className="flex items-center gap-6 mb-4">
            <div className="text-center">
              <div className="text-xl font-bold">{videoCount}</div>
              <div className="text-xs text-muted-foreground">Videos</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold">{followerCount}</div>
              <div className="text-xs text-muted-foreground">Followers</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold">{followingCount}</div>
              <div className="text-xs text-muted-foreground">Following</div>
            </div>
          </div>

          {/* Follow Button */}
          {!isOwnProfile && (
            <Button
              onClick={handleFollowToggle}
              variant={isFollowing ? 'outline' : 'default'}
              className="gap-2"
            >
              {isFollowing ? (
                <>
                  <UserMinus className="w-4 h-4" />
                  Following
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Follow
                </>
              )}
            </Button>
          )}

          {isOwnProfile && (
            <Button
              onClick={() => navigate('/profile')}
              variant="outline"
            >
              Edit Profile
            </Button>
          )}
        </motion.div>

        {/* Videos Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Video className="w-5 h-5" />
            <h3 className="font-semibold">Uploaded Videos</h3>
            <span className="text-sm text-muted-foreground">({videoCount})</span>
          </div>

          {videos.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Video className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No videos uploaded yet</p>
            </div>
          ) : (
            <CreatorVideoGrid videos={videos} />
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default CreatorProfile;
