
import { useNavigate, useLocation } from "react-router-dom";
import { LayoutDashboard, BarChart3, UserCircle2, Users, BadgePercent } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

const NavigationBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useOnboarding();
  const { theme } = useTheme();
  const isMobile = useIsMobile();
  
  // Get accent color based on environment - enhanced for more noticeable theming
  const getAccentColor = () => {
    switch (state.environment) {
      case 'office': return "text-blue-700 bg-blue-100/90";
      case 'park': return "text-green-700 bg-green-100/90";
      case 'home': return "text-orange-700 bg-orange-100/90";
      case 'coffee-shop': return "text-amber-700 bg-amber-100/90";
      case 'library': return "text-gray-700 bg-gray-100/90";
      default: return "text-triage-purple bg-purple-100/90";
    }
  };
  
  // Get background color for active item - more vibrant
  const getActiveBgColor = () => {
    switch (state.environment) {
      case 'office': return "bg-blue-100";
      case 'park': return "bg-green-100";
      case 'home': return "bg-orange-100";
      case 'coffee-shop': return "bg-amber-100";
      case 'library': return "bg-gray-100";
      default: return "bg-purple-100";
    }
  };

  // Get border color for active indicator
  const getActiveBorderColor = () => {
    switch (state.environment) {
      case 'office': return "bg-blue-500";
      case 'park': return "bg-green-500";
      case 'home': return "bg-orange-500";
      case 'coffee-shop': return "bg-amber-500";
      case 'library': return "bg-gray-500";
      default: return "bg-purple-500";
    }
  };
  
  const navItems = [
    {
      label: "Home",
      icon: <LayoutDashboard className="h-5 w-5" />,
      onClick: () => navigate("/dashboard"),
      active: location.pathname === "/dashboard",
    },
    {
      label: "Community",
      icon: <Users className="h-5 w-5" />,
      onClick: () => navigate("/community"),
      active: location.pathname === "/community" || location.pathname.startsWith("/community/"),
    },
    {
      label: "Bonuses",
      icon: <BadgePercent className="h-5 w-5" />,
      onClick: () => navigate("/bonuses"),
      active: location.pathname === "/bonuses",
    },
    {
      label: "Results",
      icon: <BarChart3 className="h-5 w-5" />,
      onClick: () => navigate("/reports"),
      active: location.pathname === "/reports",
    },
    // Only add the Profile button if not on mobile to avoid overcrowding
    ...(!isMobile ? [
      {
        label: "Profile",
        icon: <UserCircle2 className="h-5 w-5" />,
        onClick: () => navigate("/profile"),
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
