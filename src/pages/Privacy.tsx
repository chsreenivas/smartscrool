import { motion } from 'framer-motion';
import { ArrowLeft, Shield, Lock, Users, Eye, Server, Heart, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const PrivacyPromise = () => {
  const navigate = useNavigate();

  const promises = [
    {
      icon: Lock,
      title: "Private by Default",
      description: "Everything you post is private. Only friends you've accepted can see your content. No public feeds, ever."
    },
    {
      icon: Users,
      title: "Friends-Only Sharing",
      description: "Videos and reposts are only visible to your approved friends or specific groups you choose. Nobody else."
    },
    {
      icon: Eye,
      title: "No Public Discovery",
      description: "Your profile, videos, and activity are never searchable by strangers. We don't expose you to the internet."
    },
    {
      icon: Server,
      title: "Your Data Stays Private",
      description: "We don't sell your data. Period. We don't show ads. We exist to help you learn, not to profit from your attention."
    },
    {
      icon: Shield,
      title: "Safe for Everyone",
      description: "Built with minors in mind. No DMs from strangers, no viral algorithms, no dark patterns to keep you scrolling."
    },
    {
      icon: Heart,
      title: "Education First",
      description: "Every video is AI-checked to be educational. Non-educational content is filtered out automatically."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.header
        className="fixed top-0 left-0 right-0 z-50 px-4 py-3 flex items-center gap-3 bg-background/80 backdrop-blur-sm border-b border-border"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
      >
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          <h1 className="font-display text-lg font-bold">Privacy Promise</h1>
        </div>
      </motion.header>

      <main className="pt-20 pb-8 px-4 max-w-2xl mx-auto">
        {/* Hero */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <Shield className="w-10 h-10 text-primary" />
          </div>
          <h2 className="font-display text-2xl md:text-3xl font-bold mb-3">
            Your Privacy is Our Priority
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            BrainScroll is built from the ground up to protect you. Here's our promise to you and your family.
          </p>
        </motion.div>

        {/* Promises Grid */}
        <div className="space-y-4">
          {promises.map((promise, index) => (
            <motion.div
              key={promise.title}
              className="p-5 rounded-xl bg-card border border-border"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <promise.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-lg mb-1 flex items-center gap-2">
                    {promise.title}
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {promise.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Technical Details */}
        <motion.div
          className="mt-8 p-5 rounded-xl bg-muted/50 border border-border"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <h3 className="font-display font-semibold mb-3">How We Protect You</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Row-Level Security ensures data access is strictly controlled at the database level</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>All API endpoints require authentication - no anonymous access to user data</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>Videos are stored in private buckets - no hotlinking or unauthorized access</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>AI moderation reviews all content before it enters any feed</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>No tracking cookies, no third-party analytics, no data selling</span>
            </li>
          </ul>
        </motion.div>

        {/* CTA */}
        <motion.div
          className="mt-8 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <Button onClick={() => navigate('/feed')} className="px-8">
            Start Learning Safely
          </Button>
          <p className="text-xs text-muted-foreground mt-3">
            Questions? Contact us at privacy@brainscroll.app
          </p>
        </motion.div>
      </main>
    </div>
  );
};

export default PrivacyPromise;
