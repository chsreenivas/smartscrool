import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Flame, Zap, Video, LogOut, Settings, Users, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useCreatorProfile } from '@/hooks/useCreatorProfile';
import { CreatorVideoGrid } from '@/components/CreatorVideoGrid';
import { toast } from 'sonner';

const Profile = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { profile, loading, updateUsername, updateBio } = useProfile();
  const { videos, followerCount, followingCount, videoCount } = useCreatorProfile(user?.id || '');
  const [isEditing, setIsEditing] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [editBio, setEditBio] = useState('');

  useEffect(() => {
    if (profile) {
      setEditUsername(profile.username || '');
      setEditBio(profile.bio || '');
    }
  }, [profile]);

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out successfully');
    navigate('/');
  };

  const handleSaveProfile = async () => {
    if (editUsername.trim()) {
      await updateUsername(editUsername.trim());
    }
    await updateBio(editBio.trim());
    setIsEditing(false);
    toast.success('Profile updated!');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-30 px-4 py-3 flex items-center justify-between bg-background/80 backdrop-blur-md border-b border-border/50">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="font-display text-lg font-bold">Profile</h1>
        <button onClick={() => setIsEditing(!isEditing)} className="p-2 -mr-2">
          {isEditing ? <Settings className="w-6 h-6" /> : <Edit2 className="w-6 h-6" />}
        </button>
      </header>

      <main className="pt-20 pb-8 px-4 max-w-md mx-auto">
        {/* Avatar & Username */}
        <motion.div
          className="flex flex-col items-center mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-24 h-24 rounded-full bg-gradient-primary flex items-center justify-center mb-4 ring-4 ring-background">
            <span className="text-4xl font-bold text-primary-foreground">
              {profile?.username?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}
            </span>
          </div>
          
          {isEditing ? (
            <div className="w-full space-y-3 mb-4">
              <Input
                placeholder="Username"
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
                className="text-center"
              />
              <Textarea
                placeholder="Add a bio..."
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                rows={2}
                className="text-center"
              />
              <Button onClick={handleSaveProfile} className="w-full">
                Save Profile
              </Button>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold">{profile?.username || 'User'}</h2>
              <p className="text-muted-foreground text-sm">{user?.email}</p>
              {profile?.bio && (
                <p className="text-muted-foreground text-center mt-2 max-w-xs">{profile.bio}</p>
              )}
            </>
          )}
        </motion.div>

        {/* Stats Grid - Updated with followers */}
        <motion.div
          className="grid grid-cols-4 gap-2 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="bg-card rounded-xl p-3 border border-border/50 text-center">
            <div className="flex items-center justify-center mb-1">
              <Video className="w-4 h-4 text-primary" />
            </div>
            <div className="text-xl font-bold">{videoCount}</div>
            <div className="text-xs text-muted-foreground">Videos</div>
          </div>

          <div className="bg-card rounded-xl p-3 border border-border/50 text-center">
            <div className="flex items-center justify-center mb-1">
              <Users className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-xl font-bold">{followerCount}</div>
            <div className="text-xs text-muted-foreground">Followers</div>
          </div>

          <div className="bg-card rounded-xl p-3 border border-border/50 text-center">
            <div className="flex items-center justify-center mb-1">
              <Flame className="w-4 h-4 text-orange-500" />
            </div>
            <div className="text-xl font-bold">{profile?.streak || 0}</div>
            <div className="text-xs text-muted-foreground">Streak</div>
          </div>

          <div className="bg-card rounded-xl p-3 border border-border/50 text-center">
            <div className="flex items-center justify-center mb-1">
              <Zap className="w-4 h-4 text-yellow-500" />
            </div>
            <div className="text-xl font-bold">{profile?.xp || 0}</div>
            <div className="text-xs text-muted-foreground">XP</div>
          </div>
        </motion.div>

        {/* XP Progress */}
        <motion.div
          className="bg-card rounded-2xl p-4 border border-border/50 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-sm">Level Progress</h3>
            <span className="text-xs text-muted-foreground">
              Level {Math.floor((profile?.xp || 0) / 100) + 1}
            </span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-primary"
              initial={{ width: 0 }}
              animate={{ width: `${(profile?.xp || 0) % 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {100 - ((profile?.xp || 0) % 100)} XP to next level
          </p>
        </motion.div>

        {/* Interests */}
        {profile?.interests && profile.interests.length > 0 && (
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="text-sm font-semibold mb-2">Interests</h3>
            <div className="flex flex-wrap gap-2">
              {profile.interests.map((interest) => (
                <span
                  key={interest}
                  className="px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-medium"
                >
                  {interest}
                </span>
              ))}
            </div>
            <button
              onClick={() => navigate('/interests')}
              className="text-primary text-xs mt-2 hover:underline"
            >
              Edit interests
            </button>
          </motion.div>
        )}

        {/* My Videos */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Video className="w-4 h-4" />
              My Videos ({videoCount})
            </h3>
          </div>
          
          {videos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-xl">
              <Video className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm mb-3">No videos uploaded yet</p>
              <Button size="sm" onClick={() => navigate('/upload')}>
                Upload First Video
              </Button>
            </div>
          ) : (
            <CreatorVideoGrid videos={videos} />
          )}
        </motion.div>

        {/* Actions */}
        <motion.div
          className="space-y-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Button
            variant="outline"
            className="w-full h-12 justify-start gap-3"
            onClick={() => navigate('/upload')}
          >
            <Video className="w-5 h-5" />
            Upload a Short
          </Button>

          <Button
            variant="outline"
            className="w-full h-12 justify-start gap-3"
            onClick={() => navigate('/topics')}
          >
            <Zap className="w-5 h-5" />
            Browse Topics
          </Button>

          <Button
            variant="outline"
            className="w-full h-12 justify-start gap-3 text-destructive hover:text-destructive"
            onClick={handleSignOut}
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </Button>
        </motion.div>
      </main>
    </div>
  );
};

export default Profile;
