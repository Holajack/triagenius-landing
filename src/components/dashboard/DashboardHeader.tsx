
import { useState } from "react";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/common/PageHeader";

const DashboardHeader = () => {
  const { state } = useOnboarding();
  const [date] = useState(new Date());

  // Get environment display name
  const getEnvironmentName = () => {
    const environments: Record<string, string> = {
      'office': 'Office',
      'park': 'Nature',
      'home': 'Home',
      'coffee-shop': 'Coffee Shop',
      'library': 'Library'
    };
    return state.environment ? environments[state.environment] : 'Office';
  };

  // Format the current date
  const formatDate = () => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  return (
    <div className="mb-6">
      <PageHeader 
        title="Your Focus Dashboard" 
        subtitle={formatDate()}
      />
      <div className="mt-2">
        <Badge 
          variant="outline" 
          className="text-xs font-normal"
          data-walkthrough="environment-badge"
        >
          {getEnvironmentName()} Environment
        </Badge>
      </div>
    </div>
  );
};

export default DashboardHeader;
