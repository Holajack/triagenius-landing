
import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { UserProvider } from "./hooks/use-user";
import { OnboardingProvider } from "./contexts/OnboardingContext";
import { WalkthroughProvider } from "./contexts/WalkthroughContext";
import { TaskProvider } from "./contexts/TaskContext";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { UpdateNotification } from "./components/pwa/UpdateNotification";
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
import LearningToolkit from "./pages/LearningToolkit";
import NotFound from "./pages/NotFound";
import Nora from "./pages/Nora";
import PWADetector from "./components/pwa/PWADetector";
import InstallPrompt from "./components/pwa/InstallPrompt";
import FirstVisitPrompt from "./components/pwa/FirstVisitPrompt";
import { register } from "./components/ServiceWorker";

// Initialize default theme if it doesn't exist yet
if (!localStorage.getItem('theme')) {
  localStorage.setItem('theme', 'light');
}

function App() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

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

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <ThemeProvider>
            <UserProvider>
              <OnboardingProvider>
                <WalkthroughProvider>
                  <TaskProvider>
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/auth" element={<Auth />} />
                      <Route path="/onboarding" element={<Onboarding />} />
                      
                      {/* Protected routes */}
                      <Route element={<ProtectedRoute />}>
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/focus-session" element={<FocusSession />} />
                        <Route path="/break-timer" element={<BreakTimer />} />
                        <Route path="/session-reflection" element={<SessionReflection />} />
                        <Route path="/session-report/:id" element={<SessionReport />} />
                        <Route path="/reports" element={<Reports />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="/community" element={<Community />} />
                        <Route path="/leaderboard" element={<Leaderboard />} />
                        <Route path="/chat" element={<Chat />} />
                        <Route path="/community/chat/:id" element={<Chat />} />
                        <Route path="/bonuses" element={<Bonuses />} />
                        <Route path="/study-room/:id" element={<StudyRoom />} />
                        <Route path="/nora" element={<Nora />} />
                        <Route path="/learning-quiz" element={<LearningQuiz />} />
                        <Route path="/learning-toolkit" element={<LearningToolkit />} />
                        <Route path="/subscription" element={<Subscription />} />
                      </Route>
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                    
                    <Toaster richColors position="top-center" />
                    
                    {/* PWA components */}
                    <PWADetector />
                    <InstallPrompt />
                    <FirstVisitPrompt />
                    <UpdateNotification />
                  </TaskProvider>
                </WalkthroughProvider>
              </OnboardingProvider>
            </UserProvider>
          </ThemeProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
