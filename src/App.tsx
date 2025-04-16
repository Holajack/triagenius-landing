
import React, { useEffect } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Routes, Route, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { Toaster, toast } from 'sonner';
import { useUser } from '@/hooks/use-user';
import { useTheme } from '@/contexts/ThemeContext';
import Dashboard from '@/pages/Dashboard';
import FocusSession from '@/pages/FocusSession';
import SessionReport from '@/pages/SessionReport';
import Reports from '@/pages/Reports';
import StudyRoom from '@/pages/StudyRoom';
import StudyRooms from '@/pages/StudyRooms';
import SessionReflection from '@/pages/SessionReflection';
import BreakTimer from '@/pages/BreakTimer';
import Onboarding from '@/pages/Onboarding';
import Tasks from '@/pages/Tasks';
import { initializeStorageBuckets } from './integrations/supabase/storage';

function App() {
  const { pathname } = useLocation();
  const { user } = useUser();
  const { theme } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    // Initialize storage buckets for music files
    initializeStorageBuckets().catch(error => {
      console.error('Error initializing storage:', error);
    });
    
    // Redirect to onboarding if the user is new
    // Check for is_onboarding_complete instead of new_user
    if (user && user.is_onboarding_complete === false && pathname !== '/onboarding') {
      navigate('/onboarding', { replace: true });
    }
  }, [user, navigate, pathname]);

  // Route protection
  const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
    if (!user) {
      return <Navigate to="/" replace />;
    }
    return children;
  };

  const ErrorFallback = () => (
    <div role="alert">
      <p>Something went wrong:</p>
      <pre>An unexpected error occurred. Please refresh the page.</pre>
    </div>
  );

  return (
    <div className={theme}>
      <ErrorBoundary
        fallback={<ErrorFallback />}
        onError={(error) => {
          console.error('Global error:', error);
          toast.error('Something went wrong');
        }}
      >
        <Toaster position="top-center" richColors />
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
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
            path="/session-report/:id"
            element={
              <ProtectedRoute>
                <SessionReport />
              </ProtectedRoute>
            }
          />
          <Route
            path="/session-report"
            element={
              <ProtectedRoute>
                <SessionReport />
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
            path="/study-room/:id"
            element={
              <ProtectedRoute>
                <StudyRoom />
              </ProtectedRoute>
            }
          />
          <Route
            path="/study-rooms"
            element={
              <ProtectedRoute>
                <StudyRooms />
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
            path="/break-timer"
            element={
              <ProtectedRoute>
                <BreakTimer />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tasks"
            element={
              <ProtectedRoute>
                <Tasks />
              </ProtectedRoute>
            }
          />
        </Routes>
      </ErrorBoundary>
    </div>
  );
}

export default App;
