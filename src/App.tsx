import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { Suspense, lazy } from 'react';
import InstallPrompt from '@/components/pwa/InstallPrompt';

// Import your main pages
import Index from './pages/Index';

// Import other components
const FocusSession = lazy(() => import('./pages/FocusSession'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Settings = lazy(() => import('./pages/Settings'));
const TaskList = lazy(() => import('./components/tasks/TaskList'));
const Statistics = lazy(() => import('./pages/Statistics'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
import ProtectedRoute from './components/ProtectedRoute';

const App = () => {
  return (
    <ThemeProvider>
      <Router>
        <InstallPrompt />
        <Suspense fallback={<div>Loading...</div>}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
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
