
import { motion } from "framer-motion";
import { StudyEnvironment } from "@/types/onboarding";
import { Navigation } from "lucide-react";

interface HikingTrailProps {
  environment?: StudyEnvironment;
}

export const HikingTrail = ({ environment = 'office' }: HikingTrailProps) => {
  const getTrailColor = () => {
    switch (environment) {
      case 'office': return "from-blue-100 to-indigo-100";
      case 'park': return "from-green-100 to-emerald-100";
      case 'home': return "from-orange-100 to-amber-100";
      case 'coffee-shop': return "from-amber-100 to-yellow-100";
      case 'library': return "from-gray-100 to-slate-100";
      default: return "from-purple-100 to-indigo-100";
    }
  };

  return (
    <div className={`w-full h-full bg-gradient-to-r ${getTrailColor()} relative overflow-hidden`}>
      <div className="absolute inset-0 flex items-center">
        <div className="w-full h-1 bg-foreground/10 relative">
          <motion.div
            className="absolute top-1/2 -translate-y-1/2"
            initial={{ x: "0%" }}
            animate={{ x: "100%" }}
            transition={{
              duration: 25 * 60, // 25 minutes
              ease: "linear"
            }}
          >
            <Navigation className="h-6 w-6 text-primary transform -rotate-90" />
          </motion.div>
        </div>
      </div>
    </div>
  );
};
