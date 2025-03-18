
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
                  <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                  <Route path="/focus-session" element={<ProtectedRoute><FocusSession /></ProtectedRoute>} />
                  <Route path="/session-report/:id" element={<ProtectedRoute><SessionReport /></ProtectedRoute>} />
                  <Route path="/session-reflection/:id" element={<ProtectedRoute><SessionReflection /></ProtectedRoute>} />
                  <Route path="/break-timer" element={<ProtectedRoute><BreakTimer /></ProtectedRoute>} />
                  <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
                  <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                  <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                  <Route path="/community" element={<ProtectedRoute><Community /></ProtectedRoute>} />
                  <Route path="/community/room/:id" element={<ProtectedRoute><StudyRoom /></ProtectedRoute>} />
                  <Route path="/community/chat/:id" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
                  <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
                  <Route path="/bonuses" element={<ProtectedRoute><Bonuses /></ProtectedRoute>} />
                  <Route path="/nora" element={<ProtectedRoute><Nora /></ProtectedRoute>} />
                  
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
