
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { OnboardingProvider } from '@/contexts/OnboardingContext';
import { TaskProvider } from '@/contexts/TaskContext';
import { WalkthroughProvider } from '@/contexts/WalkthroughContext';
import Index from '@/pages/Index';
import Auth from '@/pages/Auth';
import Dashboard from '@/pages/Dashboard';
import FocusSession from '@/pages/FocusSession';
import BreakTimer from '@/pages/BreakTimer';
import Reports from '@/pages/Reports';
import SessionReport from '@/pages/SessionReport';
import SessionReflection from '@/pages/SessionReflection';
import Community from '@/pages/Community';
import StudyRoom from '@/pages/StudyRoom';
import Chat from '@/pages/Chat';
import Profile from '@/pages/Profile';
import Settings from '@/pages/Settings';
import Leaderboard from '@/pages/Leaderboard';
import Bonuses from '@/pages/Bonuses';
import Nora from '@/pages/Nora';
import Onboarding from '@/pages/Onboarding';
import NotFound from '@/pages/NotFound';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import './App.css';
import InstallPrompt from '@/components/pwa/InstallPrompt';

function App() {
  return (
    <React.StrictMode>
      <ThemeProvider>
        <TaskProvider>
          <OnboardingProvider>
            <WalkthroughProvider>
              <Router>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
                  <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                  <Route path="/focus-session" element={<ProtectedRoute><FocusSession /></ProtectedRoute>} />
                  <Route path="/break-timer" element={<ProtectedRoute><BreakTimer /></ProtectedRoute>} />
                  <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
                  <Route path="/session-report/:id" element={<ProtectedRoute><SessionReport /></ProtectedRoute>} />
                  <Route path="/session-reflection" element={<ProtectedRoute><SessionReflection /></ProtectedRoute>} />
                  <Route path="/community" element={<ProtectedRoute><Community /></ProtectedRoute>} />
                  <Route path="/study-room/:id" element={<ProtectedRoute><StudyRoom /></ProtectedRoute>} />
                  <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
                  <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                  <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                  <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
                  <Route path="/bonuses" element={<ProtectedRoute><Bonuses /></ProtectedRoute>} />
                  <Route path="/nora" element={<ProtectedRoute><Nora /></ProtectedRoute>} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
                <InstallPrompt />
              </Router>
            </WalkthroughProvider>
          </OnboardingProvider>
        </TaskProvider>
      </ThemeProvider>
    </React.StrictMode>
  );
}

export default App;
