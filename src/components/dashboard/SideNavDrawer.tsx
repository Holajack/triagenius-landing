
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
import { cn } from "@/lib/utils";
import { useState } from "react";
import { toast } from "sonner";
import { useAuthState } from "@/hooks/use-auth-state";

interface SideNavDrawerProps {
  children: React.ReactNode;
}

const SideNavDrawer: React.FC<SideNavDrawerProps> = ({ children }) => {
  const navigate = useNavigate();
  const { state } = useOnboarding();
  const [theme] = useState(() => localStorage.getItem('theme') || 'light');
  const { signOut } = useAuthState();
  const [logoutLoading, setLogoutLoading] = useState(false);

  // Get accent color based on environment - more vibrant and enhanced
  const getAccentColor = () => {
    switch (state.environment) {
      case 'office': return "text-blue-600 hover:bg-blue-50";
      case 'park': return "text-green-800 hover:bg-green-100"; // Darker forest green
      case 'home': return "text-orange-500 hover:bg-orange-50"; // Lighter sunrise orange
      case 'coffee-shop': return "text-amber-900 hover:bg-amber-100"; // Darker coffee bean
      case 'library': return "text-gray-600 hover:bg-gray-50";
      default: return "text-triage-purple hover:bg-purple-50";
    }
  };

  // Get background style for the drawer based on environment - enhanced colors
  const getDrawerStyle = () => {
    switch (state.environment) {
      case 'office': return "bg-gradient-to-br from-blue-50/30 to-transparent border-l-2 border-blue-100";
      case 'park': return "bg-gradient-to-br from-green-100/40 to-transparent border-l-2 border-green-200"; // Darker forest green
      case 'home': return "bg-gradient-to-br from-orange-50/30 to-transparent border-l-2 border-orange-100"; // Lighter sunrise orange
      case 'coffee-shop': return "bg-gradient-to-br from-amber-100/40 to-transparent border-l-2 border-amber-200"; // Darker coffee bean
      case 'library': return "bg-gradient-to-br from-gray-50/30 to-transparent border-l-2 border-gray-100";
      default: return "bg-gradient-to-br from-purple-50/30 to-transparent border-l-2 border-purple-100";
    }
  };

  const handleLogout = async () => {
    try {
      setLogoutLoading(true);
      await signOut();
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

  // Get environment-specific class for the header title - enhanced colors
  const getHeaderTitleClass = () => {
    switch (state.environment) {
      case 'office': return "text-blue-700";
      case 'park': return "text-green-800"; // Darker forest green
      case 'home': return "text-orange-500"; // Lighter sunrise orange
      case 'coffee-shop': return "text-amber-900"; // Darker coffee bean
      case 'library': return "text-gray-700";
      default: return "text-triage-purple";
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>
      <SheetContent side="right" className={`w-[270px] sm:w-[300px] flex flex-col ${getDrawerStyle()}`}>
        <SheetHeader className="text-left">
          <SheetTitle className={`text-center text-xl ${getHeaderTitleClass()}`}>
            The Triage System
          </SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-2 p-4 mt-4 flex-1">
          {navItems.map((item) => (
            <Button
              key={item.label}
              variant="ghost"
              className={`flex items-center justify-start gap-3 w-full py-6 ${getAccentColor()}`}
              onClick={item.onClick}
            >
              <span>
                {item.icon}
              </span>
              <span className="text-base">
                {item.label}
              </span>
            </Button>
          ))}
        </div>
        
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
