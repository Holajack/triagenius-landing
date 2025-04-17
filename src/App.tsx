
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { UserProvider } from './hooks/use-user'; 
import { OnboardingProvider } from './contexts/OnboardingContext';
import { TaskProvider } from './contexts/TaskContext';
import Dashboard from './pages/Dashboard';
import FocusSession from './pages/FocusSession';
import Bonuses from './pages/Bonuses';
import Reports from './pages/Reports';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Auth from './pages/Auth';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Subscription from './pages/Subscription';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <OnboardingProvider>
            {/* UserProvider placed after OnboardingProvider as it might depend on onboarding state */}
            <UserProvider>
              <TaskProvider>
                <Routes>
                  <Route path="/" element={<Auth />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route element={<ProtectedRoute />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/focus-session" element={<FocusSession />} />
                    <Route path="/bonuses" element={<Bonuses />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/subscription" element={<Subscription />} />
                  </Route>
                </Routes>
              </TaskProvider>
            </UserProvider>
          </OnboardingProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
