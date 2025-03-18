
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Target, Play, Timer } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

interface FocusButtonProps {
  label: string;
  icon?: "target" | "play" | "timer";
  onClick?: () => void;
  isPrimary?: boolean;
  className?: string;
}

const FocusButton = ({ 
  label, 
  icon = "target", 
  onClick, 
  isPrimary = true,
  className = "" 
}: FocusButtonProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const { theme } = useTheme();
  
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

  return (
    <Button
      className={`relative group overflow-hidden transition-all duration-300 px-6 py-6 h-auto ${
        isPrimary 
          ? "button-gradient text-white" 
          : theme === 'dark' 
            ? "bg-gray-800 border border-gray-700 text-gray-100 hover:bg-gray-700" 
            : "bg-white border border-gray-200 text-gray-800 hover:bg-gray-50"
      } rounded-xl subtle-shadow ${className}`}
      onClick={onClick}
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
