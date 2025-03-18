
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { OnboardingProvider } from './contexts/OnboardingContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { TaskProvider } from './contexts/TaskContext';
import { WalkthroughProvider } from './contexts/WalkthroughContext';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/auth/ProtectedRoute';
import PWADetector from './components/pwa/PWADetector';

// Pages
import Index from './pages/Index';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import FocusSession from './pages/FocusSession';
import SessionReport from './pages/SessionReport';
import SessionReflection from './pages/SessionReflection';
import BreakTimer from './pages/BreakTimer';
import Reports from './pages/Reports';
import Onboarding from './pages/Onboarding';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import Community from './pages/Community';
import StudyRoom from './pages/StudyRoom';
import Leaderboard from './pages/Leaderboard';
import Chat from './pages/Chat';
import Bonuses from './pages/Bonuses';
import Nora from './pages/Nora';

function App() {
  // Check if running as a PWA to optimize the mobile experience
  const isPWA = localStorage.getItem('isPWA') === 'true' || 
                window.matchMedia('(display-mode: standalone)').matches || 
                (window.navigator as any).standalone === true;

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <OnboardingProvider>
          <TaskProvider>
            <WalkthroughProvider>
              <Router>
                <Routes>
                  {/* Public routes */}
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/onboarding" element={<Onboarding />} />
                  
                  {/* Protected routes */}
                  <Route element={<ProtectedRoute />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/focus-session" element={<FocusSession />} />
                    <Route path="/session-report/:id" element={<SessionReport />} />
                    <Route path="/session-reflection/:id" element={<SessionReflection />} />
                    <Route path="/break-timer" element={<BreakTimer />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/community" element={<Community />} />
                    <Route path="/community/room/:id" element={<StudyRoom />} />
                    <Route path="/community/chat/:id" element={<Chat />} />
                    <Route path="/leaderboard" element={<Leaderboard />} />
                    <Route path="/bonuses" element={<Bonuses />} />
                    <Route path="/nora" element={<Nora />} />
                  </Route>
                  
                  {/* Fallback route */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
                
                {/* PWA Installation Prompt */}
                <PWADetector />
              </Router>
            </WalkthroughProvider>
          </TaskProvider>
        </OnboardingProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
