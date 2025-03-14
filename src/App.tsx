
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { OnboardingProvider } from "@/contexts/OnboardingContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { WalkthroughProvider } from "@/contexts/WalkthroughContext";
import Index from "./pages/Index";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import FocusSession from "./pages/FocusSession";
import SessionReport from "./pages/SessionReport";
import Community from "./pages/Community";
import Chat from "./pages/Chat";
import StudyRoom from "./pages/StudyRoom";
import Reports from "./pages/Reports";
import Profile from "./pages/Profile";
import Bonuses from "./pages/Bonuses";
import Nora from "./pages/Nora";
import Leaderboard from "./pages/Leaderboard";
import ErrorBoundary from "./components/ErrorBoundary";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <OnboardingProvider>
          <ThemeProvider>
            <WalkthroughProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/onboarding" element={<Onboarding />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/focus-session" element={<FocusSession />} />
                  <Route path="/session-report" element={<SessionReport />} />
                  <Route path="/community" element={<Community />} />
                  <Route path="/community/chat/:id" element={<Chat />} />
                  <Route path="/study-room/:id" element={<StudyRoom />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/bonuses" element={<Bonuses />} />
                  <Route path="/nora" element={<Nora />} />
                  <Route path="/leaderboard" element={<Leaderboard />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </TooltipProvider>
            </WalkthroughProvider>
          </ThemeProvider>
        </OnboardingProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
