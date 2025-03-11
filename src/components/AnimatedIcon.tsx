
import { useEffect, useState } from "react";
import { Circle, CircleOff, Sparkles } from "lucide-react";

interface AnimatedIconProps {
  className?: string;
}

const AnimatedIcon = ({ className = "" }: AnimatedIconProps) => {
  const [isActive, setIsActive] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    // Small pulse animation when first loaded
    const timer = setTimeout(() => {
      setIsActive(true);
      setTimeout(() => setIsActive(false), 1000);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleInteraction = () => {
    if (!isActive) {
      setIsActive(true);
      setHasInteracted(true);
      setTimeout(() => setIsActive(false), 1000);
    }
  };

  return (
    <div 
      className={`relative inline-flex items-center justify-center focus-circle transition-all duration-500 ${className}`}
      onClick={handleInteraction}
      onKeyDown={(e) => e.key === 'Enter' && handleInteraction()}
      role="button"
      tabIndex={0}
      aria-label="Interactive focus icon"
    >
      <div className={`absolute inset-0 rounded-full ${isActive ? 'bg-purple-100/20 animate-pulse-light' : ''} transition-all duration-500`}></div>
      
      <div className="relative z-10 transform transition-transform duration-500">
        {isActive ? (
          <div className="relative">
            <Circle 
              className="text-triage-purple w-16 h-16 md:w-20 md:h-20" 
              weight="light" 
            />
            <Sparkles 
              className="absolute top-0 left-0 w-16 h-16 md:w-20 md:h-20 text-triage-purple animate-pulse-light" 
              weight="light" 
            />
          </div>
        ) : (
          <Circle 
            className={`w-16 h-16 md:w-20 md:h-20 ${hasInteracted ? 'text-triage-purple' : 'text-gray-400'} transition-colors duration-300`} 
            weight="light" 
          />
        )}
      </div>
      
      <div className={`absolute -inset-4 md:-inset-6 rounded-full bg-gradient-to-r from-purple-100/0 via-purple-200/10 to-purple-100/0 ${isActive ? 'opacity-100' : 'opacity-0'} transition-opacity duration-500`}></div>
    </div>
  );
};

export default AnimatedIcon;
