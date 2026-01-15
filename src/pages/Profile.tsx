import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Flame, Zap, Video, Eye, LogOut, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';

const Profile = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { profile, loading } = useProfile();

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out successfully');
    navigate('/');
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
        <button onClick={() => {}} className="p-2 -mr-2">
          <Settings className="w-6 h-6" />
        </button>
      </header>

      <main className="pt-20 pb-8 px-4 max-w-md mx-auto">
        {/* Avatar & Username */}
        <motion.div
          className="flex flex-col items-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-24 h-24 rounded-full bg-gradient-primary flex items-center justify-center mb-4">
            <span className="text-4xl font-bold text-primary-foreground">
              {profile?.username?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}
            </span>
          </div>
          <h2 className="text-2xl font-bold">{profile?.username || 'User'}</h2>
          <p className="text-muted-foreground">{user?.email}</p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          className="grid grid-cols-2 gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="bg-card rounded-2xl p-6 border border-border/50 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Flame className="w-6 h-6 text-orange-500" />
            </div>
            <div className="text-3xl font-bold mb-1">{profile?.streak || 0}</div>
            <div className="text-sm text-muted-foreground">Day Streak</div>
          </div>

          <div className="bg-card rounded-2xl p-6 border border-border/50 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Zap className="w-6 h-6 text-yellow-500" />
            </div>
            <div className="text-3xl font-bold mb-1">{profile?.xp || 0}</div>
            <div className="text-sm text-muted-foreground">Total XP</div>
          </div>
        </motion.div>

        {/* Interests */}
        {profile?.interests && profile.interests.length > 0 && (
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h3 className="text-lg font-semibold mb-3">Interests</h3>
            <div className="flex flex-wrap gap-2">
              {profile.interests.map((interest) => (
                <span
                  key={interest}
                  className="px-4 py-2 rounded-full bg-secondary text-secondary-foreground text-sm font-medium"
                >
                  {interest}
                </span>
              ))}
            </div>
            <button
              onClick={() => navigate('/interests')}
              className="text-primary text-sm mt-2 hover:underline"
            >
              Edit interests
            </button>
          </motion.div>
        )}

        {/* XP Progress */}
        <motion.div
          className="bg-card rounded-2xl p-6 border border-border/50 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Level Progress</h3>
            <span className="text-sm text-muted-foreground">
              Level {Math.floor((profile?.xp || 0) / 100) + 1}
            </span>
          </div>
          <div className="h-3 bg-secondary rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-primary"
              initial={{ width: 0 }}
              animate={{ width: `${(profile?.xp || 0) % 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {100 - ((profile?.xp || 0) % 100)} XP to next level
          </p>
        </motion.div>

        {/* Actions */}
        <motion.div
          className="space-y-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
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
