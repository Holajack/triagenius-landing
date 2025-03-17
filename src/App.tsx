
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { OnboardingProvider } from "./contexts/OnboardingContext";
import { TaskProvider } from "./contexts/TaskContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { WalkthroughProvider } from "./contexts/WalkthroughContext";
import { Toaster } from "./components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";
import ErrorBoundary from "./components/ErrorBoundary";

import Index from "./pages/Index";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import FocusSession from "./pages/FocusSession";
import SessionReport from "./pages/SessionReport";
import Reports from "./pages/Reports";
import Community from "./pages/Community";
import StudyRoom from "./pages/StudyRoom";
import Chat from "./pages/Chat";
import Profile from "./pages/Profile";
import Leaderboard from "./pages/Leaderboard";
import Bonuses from "./pages/Bonuses";
import Nora from "./pages/Nora";
import NotFound from "./pages/NotFound";
import Settings from "./pages/Settings";

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <OnboardingProvider>
          <ThemeProvider>
            <TaskProvider>
              <WalkthroughProvider>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/onboarding" element={<Onboarding />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/focus-session" element={<FocusSession />} />
                  <Route path="/session-report" element={<SessionReport />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/community" element={<Community />} />
                  <Route path="/study-room/:id?" element={<StudyRoom />} />
                  <Route path="/chat" element={<Chat />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/leaderboard" element={<Leaderboard />} />
                  <Route path="/bonuses" element={<Bonuses />} />
                  <Route path="/nora" element={<Nora />} />
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
  );
}

export default App;
