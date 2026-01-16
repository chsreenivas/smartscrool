import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Users, 
  Video, 
  Eye, 
  Zap, 
  Check, 
  X, 
  Play,
  BarChart3,
  Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdmin } from '@/hooks/useAdmin';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const Admin = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { 
    isAdmin, 
    isModerator, 
    pendingShorts, 
    analytics, 
    loading,
    approveShort,
    rejectShort,
    getOverallStats
  } = useAdmin();
  
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalShorts: 0,
    totalViews: 0,
    totalXP: 0
  });
  const [activeTab, setActiveTab] = useState<'overview' | 'moderation' | 'analytics'>('overview');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (isAdmin || isModerator) {
      getOverallStats().then(setStats);
    }
  }, [isAdmin, isModerator, getOverallStats]);

  const handleApprove = async (shortId: string) => {
    const { error } = await approveShort(shortId);
    if (error) {
      toast.error(error);
    } else {
      toast.success('Video approved!');
    }
  };

  const handleReject = async (shortId: string) => {
    const { error } = await rejectShort(shortId);
    if (error) {
      toast.error(error);
    } else {
      toast.success('Video rejected');
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isAdmin && !isModerator) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Shield className="w-16 h-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
        <p className="text-muted-foreground mb-4">
          You don't have permission to access this page.
        </p>
        <Button onClick={() => navigate('/feed')}>
          Go to Feed
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/feed')} className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Admin Dashboard
            </h1>
          </div>
          <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
            {isAdmin ? 'Admin' : 'Moderator'}
          </span>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b">
        <div className="max-w-6xl mx-auto px-4 flex gap-4">
          {(['overview', 'moderation', 'analytics'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 px-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === 'moderation' && pendingShorts.length > 0 && (
                <span className="ml-2 px-1.5 py-0.5 text-xs bg-destructive text-destructive-foreground rounded-full">
                  {pendingShorts.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-6xl mx-auto p-4 space-y-6">
        {activeTab === 'overview' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4"
          >
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Total Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{stats.totalUsers.toLocaleString()}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Video className="w-4 h-4" />
                  Total Videos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{stats.totalShorts.toLocaleString()}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Total Views
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{stats.totalViews.toLocaleString()}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Total XP Earned
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{stats.totalXP.toLocaleString()}</p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {activeTab === 'moderation' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <h2 className="text-lg font-semibold">Pending Approval ({pendingShorts.length})</h2>
            
            {pendingShorts.length === 0 ? (
              <Card className="p-8 text-center">
                <Check className="w-12 h-12 text-success mx-auto mb-4" />
                <p className="text-lg font-medium">All caught up!</p>
                <p className="text-muted-foreground">No videos pending approval</p>
              </Card>
            ) : (
              <div className="grid gap-4">
                {pendingShorts.map((short) => (
                  <Card key={short.id}>
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        <div className="relative w-32 h-20 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                          {short.thumbnail_url ? (
                            <img
                              src={short.thumbnail_url}
                              alt={short.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Play className="w-8 h-8 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">{short.title}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {short.description || 'No description'}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs px-2 py-0.5 rounded-full bg-muted">
                              {short.category}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              by {short.uploader?.username || 'Unknown'}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleApprove(short.id)}
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleReject(short.id)}
                          >
                            <X className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'analytics' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Top Performing Videos
            </h2>
            
            {analytics.length === 0 ? (
              <Card className="p-8 text-center">
                <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium">No analytics yet</p>
                <p className="text-muted-foreground">Data will appear once videos get views</p>
              </Card>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">Video</th>
                      <th className="text-right py-3 px-4 font-medium">Views</th>
                      <th className="text-right py-3 px-4 font-medium">Likes</th>
                      <th className="text-right py-3 px-4 font-medium">Completion</th>
                      <th className="text-right py-3 px-4 font-medium">Avg Watch</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.map((item) => (
                      <tr key={item.id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium">{item.short?.title || 'Unknown'}</p>
                            <p className="text-xs text-muted-foreground">{item.short?.category}</p>
                          </div>
                        </td>
                        <td className="text-right py-3 px-4">{item.views_count.toLocaleString()}</td>
                        <td className="text-right py-3 px-4">{item.likes_count.toLocaleString()}</td>
                        <td className="text-right py-3 px-4">{Math.round(item.completion_rate * 100)}%</td>
                        <td className="text-right py-3 px-4">{item.avg_watch_time_seconds}s</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default Admin;
