
import React from "react";
import { Button } from "@/components/ui/button";
import { Play, LogIn, ArrowUpRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface FocusButtonProps {
  label: string;
  icon?: "play" | "login" | "arrow";
  isPrimary?: boolean;
  className?: string;
  navigateTo?: string;
  onClick?: () => void;
}

const FocusButton: React.FC<FocusButtonProps> = ({
  label,
  icon = "play",
  isPrimary = true,
  className = "",
  navigateTo,
  onClick
}) => {
  const navigate = useNavigate();
  
  const handleClick = () => {
    if (onClick) {
      onClick();
    }
    
    if (navigateTo) {
      const isPwa = window.matchMedia('(display-mode: standalone)').matches || 
                   (window.navigator as any).standalone === true;
      
      // Log navigation attempt
      console.log(`Navigating to: ${navigateTo}, isPWA: ${isPwa}`);
      
      // Directly navigate - no delays for PWA
      navigate(navigateTo);
    }
  };
  
  const IconComponent = () => {
    if (icon === "play") return <Play className="w-4 h-4 mr-2" />;
    if (icon === "login") return <LogIn className="w-4 h-4 mr-2" />;
    if (icon === "arrow") return <ArrowUpRight className="w-4 h-4 mr-2" />;
    return null;
  };

  return (
    <Button
      onClick={handleClick}
      className={`${
        isPrimary
          ? "bg-triage-purple hover:bg-triage-indigo text-white"
          : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
      } py-3 px-5 rounded-xl text-base font-medium transition-colors ${className}`}
    >
      <IconComponent />
      {label}
    </Button>
  );
};

export default FocusButton;
