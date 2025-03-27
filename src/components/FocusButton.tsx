
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Target, Play, Timer } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useOnboarding } from "@/contexts/OnboardingContext";

interface FocusButtonProps {
  label: string;
  icon?: "target" | "play" | "timer";
  onClick?: () => void;
  navigateTo?: string;
  isPrimary?: boolean;
  className?: string;
  theme?: string;  // Accept theme as a prop instead of using context
}

const FocusButton = ({ 
  label, 
  icon = "target", 
  onClick, 
  navigateTo,
  isPrimary = true,
  className = "",
  theme = "light" // Default to light theme 
}: FocusButtonProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();
  const { state } = useOnboarding();
  
  // Check if running as a PWA
  const isPWA = localStorage.getItem('isPWA') === 'true' || 
               window.matchMedia('(display-mode: standalone)').matches || 
               (window.navigator as any).standalone === true;
  
  const getIcon = () => {
    switch (icon) {
      case "target":
        return <Target className="w-5 h-5 mr-2" />;
      case "play":
        return <Play className="w-5 h-5 mr-2" />;
      case "timer":
        return <Timer className="w-5 h-5 mr-2" />;
      default:
        return <Target className="w-5 h-5 mr-2" />;
    }
  };
  
  // Get environment-specific colors
  const getEnvButtonGradient = () => {
    if (!isPrimary) return "";
    
    switch (state?.environment) {
      case 'office': return "bg-gradient-to-r from-blue-600 to-blue-700";
      case 'park': return "bg-gradient-to-r from-green-700 to-green-800"; // Enhanced for Park/#2E6F40
      case 'home': return "bg-gradient-to-r from-orange-500 to-orange-600"; // Enhanced for Home/#FFA263
      case 'coffee-shop': return "bg-gradient-to-r from-amber-700 to-amber-800"; // Enhanced for Coffee Shop/#854836
      case 'library': return "bg-gradient-to-r from-gray-600 to-gray-700";
      default: return "button-gradient"; // Default gradient
    }
  };

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (navigateTo) {
      navigate(navigateTo);
    }
  };

  return (
    <Button
      className={`relative group overflow-hidden transition-all duration-300 px-6 py-6 h-auto ${
        isPrimary 
          ? getEnvButtonGradient() || "button-gradient text-white" 
          : theme === 'dark' 
            ? "bg-gray-800 border border-gray-700 text-gray-100 hover:bg-gray-700" 
            : "bg-white border border-gray-200 text-gray-800 hover:bg-gray-50"
      } rounded-xl subtle-shadow ${className} ${isPWA ? 'touch-manipulation' : ''}`}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span className="flex items-center justify-center relative z-10">
        {getIcon()}
        <span className="font-medium">{label}</span>
      </span>
      
      <AnimatePresence>
        {isHovered && isPrimary && (
          <motion.span
            className="absolute inset-0 bg-white/10"
            initial={{ x: "-100%", opacity: 0.5 }}
            animate={{ x: "100%", opacity: 0.2 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          />
        )}
      </AnimatePresence>
    </Button>
  );
};

export default FocusButton;
