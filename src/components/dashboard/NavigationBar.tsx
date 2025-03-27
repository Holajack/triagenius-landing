
import { useNavigate, useLocation } from "react-router-dom";
import { LayoutDashboard, BarChart3, UserCircle2, Users, BadgePercent } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useUser } from "@/hooks/use-user";

// Enable this for debugging
const DEBUG_ENV = true;

const NavigationBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state, forceEnvironmentSync } = useOnboarding();
  const [theme] = useState(() => localStorage.getItem('theme') || 'light');
  const isMobile = useIsMobile();
  const { environmentTheme, verifyEnvironmentWithDatabase } = useTheme();
  const { user } = useUser();
  
  // Ensure environment is consistent before navigation
  const ensureEnvironmentSync = async (destination: string) => {
    // Skip sync for minor navigations or if already on the destination
    if (location.pathname === destination) return;
    
    if (DEBUG_ENV) console.log(`[NavigationBar] Preparing to navigate to: ${destination}`);
    
    // Verify environment consistency with database before navigation
    if (user?.id) {
      const isConsistent = await verifyEnvironmentWithDatabase(user.id);
      
      if (!isConsistent) {
        if (DEBUG_ENV) console.log('[NavigationBar] Environment inconsistency detected before navigation, forcing sync');
        await forceEnvironmentSync();
      }
    }
  };
  
  // Get accent color based on environment - enhanced for more noticeable theming
  const getAccentColor = () => {
    switch (state.environment) {
      case 'office': return "text-blue-700 bg-blue-100/90";
      case 'park': return "text-green-800 bg-green-100/90"; // Enhanced for Park/#2E6F40
      case 'home': return "text-orange-500 bg-orange-100/90"; // Enhanced for Home/#FFA263
      case 'coffee-shop': return "text-amber-800 bg-amber-100/90"; // Enhanced for Coffee Shop/#854836
      case 'library': return "text-gray-700 bg-gray-100/90";
      default: return "text-triage-purple bg-purple-100/90";
    }
  };
  
  // Get background color for active item - more vibrant
  const getActiveBgColor = () => {
    switch (state.environment) {
      case 'office': return "bg-blue-100";
      case 'park': return "bg-green-100"; // Enhanced for Park/#2E6F40
      case 'home': return "bg-orange-100"; // Enhanced for Home/#FFA263
      case 'coffee-shop': return "bg-amber-100"; // Enhanced for Coffee Shop/#854836
      case 'library': return "bg-gray-100";
      default: return "bg-purple-100";
    }
  };

  // Get border color for active indicator
  const getActiveBorderColor = () => {
    switch (state.environment) {
      case 'office': return "bg-blue-500";
      case 'park': return "bg-green-800"; // Enhanced for Park/#2E6F40
      case 'home': return "bg-orange-500"; // Enhanced for Home/#FFA263
      case 'coffee-shop': return "bg-amber-800"; // Enhanced for Coffee Shop/#854836
      case 'library': return "bg-gray-500";
      default: return "bg-purple-500";
    }
  };
  
  // Enhanced navigation handler that ensures environment sync
  const handleNavigation = async (path: string) => {
    await ensureEnvironmentSync(path);
    navigate(path);
  };
  
  // Listen for environment changes to update UI elements
  useEffect(() => {
    const handleEnvironmentChange = () => {
      if (DEBUG_ENV) console.log('[NavigationBar] Detected environment change, forcing re-render');
      // This will force a re-render of the component
      forceEnvironmentSync();
    };
    
    // Listen for both storage events and custom environment-changed events
    window.addEventListener('storage', (e) => {
      if (e.key === 'environment') handleEnvironmentChange();
    });
    
    document.addEventListener('environment-changed', handleEnvironmentChange);
    
    return () => {
      window.removeEventListener('storage', (e) => {
        if (e.key === 'environment') handleEnvironmentChange();
      });
      document.removeEventListener('environment-changed', handleEnvironmentChange);
    };
  }, [forceEnvironmentSync]);
  
  const navItems = [
    {
      label: "Home",
      icon: <LayoutDashboard className="h-5 w-5" />,
      onClick: () => handleNavigation("/dashboard"),
      active: location.pathname === "/dashboard",
    },
    {
      label: "Community",
      icon: <Users className="h-5 w-5" />,
      onClick: () => handleNavigation("/community"),
      active: location.pathname === "/community" || location.pathname.startsWith("/community/"),
    },
    {
      label: "Bonuses",
      icon: <BadgePercent className="h-5 w-5" />,
      onClick: () => handleNavigation("/bonuses"),
      active: location.pathname === "/bonuses",
    },
    {
      label: "Results",
      icon: <BarChart3 className="h-5 w-5" />,
      onClick: () => handleNavigation("/reports"),
      active: location.pathname === "/reports",
    },
    // Only add the Profile button if not on mobile to avoid overcrowding
    ...(!isMobile ? [
      {
        label: "Profile",
        icon: <UserCircle2 className="h-5 w-5" />,
        onClick: () => handleNavigation("/profile"),
        active: location.pathname === "/profile",
      }
    ] : [])
  ];
  
  return (
    <div className={`fixed bottom-0 left-0 right-0 bg-background border-t z-50 ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-around items-center">
          {navItems.map((item) => (
            <Button
              key={item.label}
              variant="ghost"
              className={cn(
                "flex flex-col h-16 rounded-none px-2 relative",
                item.active ? `${getActiveBgColor()} bg-opacity-60` : ""
              )}
              onClick={item.onClick}
            >
              {item.active && (
                <div className="absolute top-0 left-0 right-0 h-1 rounded-b" 
                  style={{ 
                    backgroundColor: `hsl(var(--env-primary))` 
                  }}
                />
              )}
              <div className={item.active ? getAccentColor().split(" ")[0] : "text-muted-foreground"}>
                {item.icon}
              </div>
              <span className={cn(
                "text-xs mt-1 font-medium",
                item.active ? getAccentColor().split(" ")[0] : "text-muted-foreground"
              )}>
                {item.label}
              </span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NavigationBar;
