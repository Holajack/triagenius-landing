
import { LogOut, Menu, Book, Brain, BadgePercent, LayoutDashboard, Users, Bot, BarChart3, UserCircle2, Trophy, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetTrigger
} from "@/components/ui/sheet";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface SideNavDrawerProps {
  children: React.ReactNode;
}

const SideNavDrawer: React.FC<SideNavDrawerProps> = ({ children }) => {
  const navigate = useNavigate();
  const { state } = useOnboarding();
  const { theme } = useTheme();
  const [logoutLoading, setLogoutLoading] = useState(false);

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

  const handleLogout = async () => {
    try {
      setLogoutLoading(true);
      await supabase.auth.signOut();
      toast.success("Logged out successfully");
      navigate("/auth");
    } catch (error: any) {
      console.error("Error logging out:", error);
      toast.error(`Failed to log out: ${error.message || "An unknown error occurred"}`);
    } finally {
      setLogoutLoading(false);
    }
  };

  const navItems = [
    {
      label: "Dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
      onClick: () => navigate("/dashboard"),
    },
    {
      label: "Community",
      icon: <Users className="h-5 w-5" />,
      onClick: () => navigate("/community"),
    },
    {
      label: "Nora",
      icon: <Bot className="h-5 w-5" />,
      onClick: () => navigate("/nora"),
    },
    {
      label: "Leaderboard",
      icon: <Trophy className="h-5 w-5" />,
      onClick: () => navigate("/leaderboard"),
    },
    {
      label: "Reports",
      icon: <BarChart3 className="h-5 w-5" />,
      onClick: () => navigate("/reports"),
    },
    {
      label: "Bonuses",
      icon: <BadgePercent className="h-5 w-5" />,
      onClick: () => navigate("/bonuses"),
    },
    {
      label: "Profile",
      icon: <UserCircle2 className="h-5 w-5" />,
      onClick: () => navigate("/profile"),
    },
    {
      label: "Settings",
      icon: <Settings className="h-5 w-5" />,
      onClick: () => navigate("/settings"),
    },
  ];

  return (
    <Sheet>
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>
      <SheetContent side="right" className="w-[270px] sm:w-[300px] flex flex-col">
        <SheetHeader className="text-left">
          <SheetTitle className="text-center text-xl text-triage-purple">
            The Triage System
          </SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-2 p-4 mt-4 flex-1">
          {navItems.map((item) => (
            <Button
              key={item.label}
              variant="ghost"
              className="flex items-center justify-start gap-3 w-full py-6"
              onClick={item.onClick}
            >
              <span className={getAccentColor()}>
                {item.icon}
              </span>
              <span className="text-base">
                {item.label}
              </span>
            </Button>
          ))}
        </div>
        
        {/* Logout button at the bottom */}
        <div className="px-4 pb-6 mt-auto">
          <Button 
            variant="destructive" 
            onClick={handleLogout} 
            disabled={logoutLoading} 
            className="w-full"
            size="lg"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
        
        <SheetFooter className="mt-2">
          <p className="text-center text-sm text-muted-foreground w-full">
            © {new Date().getFullYear()} The Triage System
          </p>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default SideNavDrawer;
