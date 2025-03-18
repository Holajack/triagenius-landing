
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { Suspense, lazy, useEffect } from 'react';
import InstallPrompt from '@/components/pwa/InstallPrompt';
import { Sonner, toast } from 'sonner';

// Import your main pages
import Index from './pages/Index';

// Import other components
const FocusSession = lazy(() => import('./pages/FocusSession'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Settings = lazy(() => import('./pages/Settings'));
const TaskList = lazy(() => import('./components/tasks/TaskList'));
const Statistics = lazy(() => import('./pages/Auth')); // Use existing Auth page as placeholder for Statistics
const Login = lazy(() => import('./pages/Auth')); // Use Auth page for Login
const Register = lazy(() => import('./pages/Auth')); // Use Auth page for Register
const Onboarding = lazy(() => import('./pages/Onboarding')); // Add Onboarding route
import ProtectedRoute from './components/auth/ProtectedRoute'; // Updated path

const App = () => {
  // Handle PWA-specific events
  useEffect(() => {
    // Listen for PWA toast events
    const handlePwaToast = (event: any) => {
      const { title, description, action } = event.detail;
      toast(title, {
        description: description,
        action: {
          label: "Update",
          onClick: action
        }
      });
    };
    
    window.addEventListener('pwa-show-toast', handlePwaToast);
    
    // Check if running in PWA mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                         (window.navigator as any).standalone === true;
    
    if (isStandalone) {
      console.log('App component: Running in PWA/standalone mode');
    }
    
    return () => {
      window.removeEventListener('pwa-show-toast', handlePwaToast);
    };
  }, []);
  
  return (
    <ThemeProvider>
      <Router>
        <InstallPrompt />
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-triage-purple border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading...</p>
            </div>
          </div>
        }>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/auth" element={<Login />} />
            <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
            <Route path="/focus-session" element={<ProtectedRoute><FocusSession /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/tasklist" element={<ProtectedRoute><TaskList /></ProtectedRoute>} />
            <Route path="/statistics" element={<ProtectedRoute><Statistics /></ProtectedRoute>} />
          </Routes>
        </Suspense>
      </Router>
    </ThemeProvider>
  );
};

export default App;
