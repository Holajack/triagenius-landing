import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, BarChart4, ListChecks, Settings, Crown } from 'lucide-react';

const NavigationBar = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-around items-center h-16">
          <Link
            to="/dashboard"
            className={`flex flex-col items-center justify-center p-2 rounded-lg hover:bg-accent ${
              location.pathname === '/dashboard' ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <Home className="h-6 w-6" />
            <span className="text-xs">Home</span>
          </Link>
          <Link
            to="/reports"
            className={`flex flex-col items-center justify-center p-2 rounded-lg hover:bg-accent ${
              location.pathname === '/reports' ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <BarChart4 className="h-6 w-6" />
            <span className="text-xs">Reports</span>
          </Link>
          <Link
            to="/focus-session"
            className={`flex flex-col items-center justify-center p-2 rounded-lg hover:bg-accent ${
              location.pathname === '/focus-session' ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <ListChecks className="h-6 w-6" />
            <span className="text-xs">Focus</span>
          </Link>
          <Link
            to="/settings"
            className={`flex flex-col items-center justify-center p-2 rounded-lg hover:bg-accent ${
              location.pathname === '/settings' ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <Settings className="h-6 w-6" />
            <span className="text-xs">Settings</span>
          </Link>
          <Link
            to="/subscription"
            className={`flex flex-col items-center justify-center p-2 rounded-lg hover:bg-accent ${
              location.pathname === '/subscription' ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <Crown className="h-6 w-6" />
            <span className="text-xs">Plans</span>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default NavigationBar;
