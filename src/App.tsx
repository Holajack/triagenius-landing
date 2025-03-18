import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { UserProvider } from "./hooks/use-user";
import { OnboardingProvider } from "./contexts/OnboardingContext";
import { WalkthroughProvider } from "./contexts/WalkthroughContext";
import { TaskProvider } from "./contexts/TaskContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import FocusSession from "./pages/FocusSession";
import BreakTimer from "./pages/BreakTimer";
import SessionReflection from "./pages/SessionReflection";
import SessionReport from "./pages/SessionReport";
import Reports from "./pages/Reports";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Community from "./pages/Community";
import Onboarding from "./pages/Onboarding";
import Leaderboard from "./pages/Leaderboard";
import Chat from "./pages/Chat";
import StudyRoom from "./pages/StudyRoom";
import Bonuses from "./pages/Bonuses";
import LearningQuiz from "./pages/LearningQuiz";
import NotFound from "./pages/NotFound";
import Nora from "./pages/Nora";
import PWADetector from "./components/pwa/PWADetector";
import InstallPrompt from "./components/pwa/InstallPrompt";
import { register } from "./components/ServiceWorker";

function App() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleAppError = (error: Error) => {
    console.error("Application error:", error);
    setHasError(true);
  };

  useEffect(() => {
    setHasError(false);
  }, [window.location.pathname]);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <UserProvider>
          <OnboardingProvider>
            <WalkthroughProvider>
              <TaskProvider>
                <BrowserRouter>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/onboarding" element={<Onboarding />} />
                    
                    <Route element={<ProtectedRoute />}>
                      <Route path="/dashboard" element={
                        <ErrorBoundary>
                          <Dashboard />
                        </ErrorBoundary>
                      } />
                      <Route path="/focus-session" element={
                        <ErrorBoundary>
                          <FocusSession />
                        </ErrorBoundary>
                      } />
                      <Route path="/break-timer" element={<BreakTimer />} />
                      <Route path="/session-reflection" element={<SessionReflection />} />
                      <Route path="/session-report/:id" element={<SessionReport />} />
                      <Route path="/reports" element={<Reports />} />
                      <Route path="/profile" element={
                        <ErrorBoundary>
                          <Profile />
                        </ErrorBoundary>
                      } />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="/community" element={<Community />} />
                      <Route path="/leaderboard" element={<Leaderboard />} />
                      <Route path="/chat" element={<Chat />} />
                      <Route path="/bonuses" element={<Bonuses />} />
                      <Route path="/study-room/:id?" element={<StudyRoom />} />
                      <Route path="/nora" element={<Nora />} />
                      <Route path="/learning-quiz" element={<LearningQuiz />} />
                    </Route>
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                  
                  <Toaster richColors position="top-center" />
                  
                  <PWADetector />
                  <InstallPrompt />
                </BrowserRouter>
              </TaskProvider>
            </WalkthroughProvider>
          </OnboardingProvider>
        </UserProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
