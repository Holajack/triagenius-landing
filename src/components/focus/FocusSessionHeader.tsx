
import React from "react";
import { Button } from "@/components/ui/button";
import { Battery, BatteryLow } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";

interface FocusSessionHeaderProps {
  lowPowerMode: boolean;
  toggleLowPowerMode: () => void;
  operationInProgress: boolean;
}

const FocusSessionHeader: React.FC<FocusSessionHeaderProps> = ({
  lowPowerMode,
  toggleLowPowerMode,
  operationInProgress
}) => {
  return (
    <div className="flex justify-between items-center">
      <PageHeader title="Focus Session" subtitle="Stay focused and achieve your goals" />
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={toggleLowPowerMode}
        title={lowPowerMode ? "Switch to enhanced mode" : "Switch to low power mode"}
        disabled={operationInProgress}
      >
        {lowPowerMode ? <Battery className="h-5 w-5" /> : <BatteryLow className="h-5 w-5" />}
      </Button>
    </div>
  );
};

export default FocusSessionHeader;
