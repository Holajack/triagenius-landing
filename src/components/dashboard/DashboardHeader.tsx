
import { useState } from "react";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { SunIcon, MoonIcon, Settings, MoreVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import SideNavDrawer from "./SideNavDrawer";

const DashboardHeader = () => {
  const { state } = useOnboarding();
  const { theme, toggleTheme } = useTheme();
  const [date] = useState(new Date());

  // Get environment display name
  const getEnvironmentName = () => {
    const environments: Record<string, string> = {
      'office': 'Office',
      'park': 'Nature',
      'home': 'Home',
      'coffee-shop': 'Coffee Shop',
      'library': 'Library'
    };
    return state.environment ? environments[state.environment] : 'Office';
  };

  // Format the current date
  const formatDate = () => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  return (
    <header className="pt-6 pb-4">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Your Focus Dashboard</h1>
          <div className="flex items-center gap-2">
            <p className="text-sm text-muted-foreground">{formatDate()}</p>
            <Badge variant="outline" className="text-xs font-normal">
              {getEnvironmentName()} Environment
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="ghost"
            className="text-muted-foreground"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? (
              <SunIcon className="h-5 w-5" />
            ) : (
              <MoonIcon className="h-5 w-5" />
            )}
          </Button>
          <Button size="icon" variant="ghost" className="text-muted-foreground">
            <Settings className="h-5 w-5" />
          </Button>
          <SideNavDrawer>
            <Button size="icon" variant="ghost" className="text-muted-foreground md:hidden">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </SideNavDrawer>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
