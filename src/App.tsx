
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { OnboardingProvider } from "@/contexts/OnboardingContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Index from "./pages/Index";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import FocusSession from "./pages/FocusSession";
import SessionReport from "./pages/SessionReport";
import Community from "./pages/Community";
import Chat from "./pages/Chat";
import StudyRoom from "./pages/StudyRoom";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <OnboardingProvider>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/focus-session" element={<FocusSession />} />
              <Route path="/session-report" element={<SessionReport />} />
              <Route path="/community" element={<Community />} />
              <Route path="/community/chat/:id" element={<Chat />} />
              <Route path="/study-room/:id" element={<StudyRoom />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </OnboardingProvider>
  </QueryClientProvider>
);

export default App;
