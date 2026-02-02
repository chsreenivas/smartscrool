import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Welcome from "./pages/Welcome";
import Auth from "./pages/Auth";
import Interests from "./pages/Interests";
import Feed from "./pages/Feed";
import Upload from "./pages/Upload";
import Profile from "./pages/Profile";
import Social from "./pages/Social";
import Admin from "./pages/Admin";
import Privacy from "./pages/Privacy";
import Topics from "./pages/Topics";
import Topic from "./pages/Topic";
import CreatorProfile from "./pages/CreatorProfile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Welcome />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/interests" element={<Interests />} />
            <Route path="/feed" element={<Feed />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/creator/:userId" element={<CreatorProfile />} />
            <Route path="/social" element={<Social />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/topics" element={<Topics />} />
            <Route path="/topic/:topicSlug" element={<Topic />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
