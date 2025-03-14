
import { useNavigate, useLocation } from "react-router-dom";
import { LayoutDashboard, Bot, BarChart3, UserCircle2, Users, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import SideNavDrawer from "./SideNavDrawer";

const NavigationBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useOnboarding();
  const { theme } = useTheme();
  const isMobile = useIsMobile();
  
  // Get accent color based on environment
  const getAccentColor = () => {
    switch (state.environment) {
      case 'office': return "text-blue-600";
      case 'park': return "text-green-600";
      case 'home': return "text-orange-600";
      case 'coffee-shop': return "text-amber-600";
      case 'library': return "text-gray-600";
      default: return "text-triage-purple";
    }
  };
  
  const navItems = isMobile ? [
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
      label: "Nora",
      icon: <Bot className="h-5 w-5" />,
      onClick: () => navigate("/dashboard"),
      active: false,
    },
    {
      label: "Reports",
      icon: <BarChart3 className="h-5 w-5" />,
      onClick: () => navigate("/reports"),
      active: location.pathname === "/reports",
    }
  ] : [
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
      label: "Nora",
      icon: <Bot className="h-5 w-5" />,
      onClick: () => navigate("/dashboard"),
      active: false,
    },
    {
      label: "Reports",
      icon: <BarChart3 className="h-5 w-5" />,
      onClick: () => navigate("/reports"),
      active: location.pathname === "/reports",
    },
    {
      label: "Profile",
      icon: <UserCircle2 className="h-5 w-5" />,
      onClick: () => navigate("/profile"),
      active: location.pathname === "/profile",
    },
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
                "flex flex-col h-16 rounded-none px-2",
                item.active ? "bg-transparent" : ""
              )}
              onClick={item.onClick}
            >
              <div className={item.active ? getAccentColor() : "text-muted-foreground"}>
                {item.icon}
              </div>
              <span className={cn(
                "text-xs mt-1",
                item.active ? getAccentColor() : "text-muted-foreground"
              )}>
                {item.label}
              </span>
            </Button>
          ))}
          
          {isMobile && (
            <SideNavDrawer>
              <Button
                variant="ghost"
                className="flex flex-col h-16 rounded-none px-2"
              >
                <div className="text-muted-foreground">
                  <MoreVertical className="h-5 w-5" />
                </div>
                <span className="text-xs mt-1 text-muted-foreground">
                  More
                </span>
              </Button>
            </SideNavDrawer>
          )}
        </div>
      </div>
    </div>
  );
};

export default NavigationBar;
