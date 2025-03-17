
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Index from "@/pages/Index";
import Dashboard from "@/pages/Dashboard";
import FocusSession from "@/pages/FocusSession";
import BreakTimer from "@/pages/BreakTimer";
import SessionReflection from "@/pages/SessionReflection";
import Reports from "@/pages/Reports";
import SessionReport from "@/pages/SessionReport";
import Community from "@/pages/Community";
import StudyRoom from "@/pages/StudyRoom";
import Chat from "@/pages/Chat";
import Profile from "@/pages/Profile";
import Settings from "@/pages/Settings";
import Bonuses from "@/pages/Bonuses";
import Leaderboard from "@/pages/Leaderboard";
import Nora from "@/pages/Nora";
import NotFound from "@/pages/NotFound";
import Onboarding from "@/pages/Onboarding";
import Auth from "@/pages/Auth";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { Toaster } from "@/components/ui/toaster";
import ErrorBoundary from "@/components/ErrorBoundary";
import { OnboardingProvider } from "@/contexts/OnboardingContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { TaskProvider } from "@/contexts/TaskContext";
import { WalkthroughProvider } from "@/contexts/WalkthroughContext";

export default function App() {
  return (
    <ErrorBoundary>
      <Router>
        <ThemeProvider>
          <OnboardingProvider>
            <TaskProvider>
              <WalkthroughProvider>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/onboarding" element={<Onboarding />} />
                  <Route 
                    path="/dashboard" 
                    element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/focus-session" 
                    element={
                      <ProtectedRoute>
                        <FocusSession />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/break-timer" 
                    element={
                      <ProtectedRoute>
                        <BreakTimer />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/session-reflection" 
                    element={
                      <ProtectedRoute>
                        <SessionReflection />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/reports" 
                    element={
                      <ProtectedRoute>
                        <Reports />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/session-report/:id" 
                    element={
                      <ProtectedRoute>
                        <SessionReport />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/community" 
                    element={
                      <ProtectedRoute>
                        <Community />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/study-room/:id" 
                    element={
                      <ProtectedRoute>
                        <StudyRoom />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/chat" 
                    element={
                      <ProtectedRoute>
                        <Chat />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/profile" 
                    element={
                      <ProtectedRoute>
                        <Profile />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/settings" 
                    element={
                      <ProtectedRoute>
                        <Settings />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/bonuses" 
                    element={
                      <ProtectedRoute>
                        <Bonuses />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/leaderboard" 
                    element={
                      <ProtectedRoute>
                        <Leaderboard />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/nora" 
                    element={
                      <ProtectedRoute>
                        <Nora />
                      </ProtectedRoute>
                    } 
                  />
                  <Route path="*" element={<NotFound />} />
                </Routes>
                <Toaster />
              </WalkthroughProvider>
            </TaskProvider>
          </OnboardingProvider>
        </ThemeProvider>
      </Router>
    </ErrorBoundary>
  );
}
