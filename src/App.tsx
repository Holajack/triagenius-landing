
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { OnboardingProvider } from "./contexts/OnboardingContext";
import { TaskProvider } from "./contexts/TaskContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { WalkthroughProvider } from "./contexts/WalkthroughContext";
import { Toaster } from "./components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";
import ErrorBoundary from "./components/ErrorBoundary";

import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Onboarding from "./pages/Onboarding";
import NotFound from "./pages/NotFound";
import FocusSession from "./pages/FocusSession";
import BreakTimer from "./pages/BreakTimer";
import SessionReflection from "./pages/SessionReflection";
import SessionReport from "./pages/SessionReport";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Reports from "./pages/Reports";
import Community from "./pages/Community";
import StudyRoom from "./pages/StudyRoom";
import Chat from "./pages/Chat";
import Leaderboard from "./pages/Leaderboard";
import Bonuses from "./pages/Bonuses";
import Nora from "./pages/Nora";

function App() {
  return (
    <div className="h-[100dvh] w-full relative">
      <ErrorBoundary>
        <BrowserRouter>
          <OnboardingProvider>
            <ThemeProvider>
              <TaskProvider>
                <WalkthroughProvider>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/onboarding" element={<Onboarding />} />
                    <Route path="/focus-session" element={<FocusSession />} />
                    <Route path="/session-reflection" element={<SessionReflection />} />
                    <Route path="/session-report" element={<SessionReport />} />
                    <Route path="/session-report/:id" element={<SessionReport />} />
                    <Route path="/break-timer" element={<BreakTimer />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/chat" element={<Chat />} />
                    <Route path="/nora" element={<Nora />} />
                    <Route path="/community" element={<Community />} />
                    <Route path="/study-room" element={<StudyRoom />} />
                    <Route path="/leaderboard" element={<Leaderboard />} />
                    <Route path="/bonuses" element={<Bonuses />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </WalkthroughProvider>
              </TaskProvider>
            </ThemeProvider>
          </OnboardingProvider>
          <Toaster />
          <SonnerToaster position="top-right" closeButton richColors />
        </BrowserRouter>
      </ErrorBoundary>
    </div>
  );
}

export default App;
