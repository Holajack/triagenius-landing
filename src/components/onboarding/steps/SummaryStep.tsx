
import { Card } from "@/components/ui/card";
import { useOnboarding } from "@/contexts/OnboardingContext";

export const SummaryStep = () => {
  const { state } = useOnboarding();

  return (
    <div className="grid gap-4">
      <Card className="p-4">
        <h3 className="font-medium mb-4">Your preferences:</h3>
        <div className="space-y-2 text-sm text-gray-600">
          <p>Goal: {state.userGoal}</p>
          <p>Work Style: {state.workStyle}</p>
          <p>Environment: {state.environment}</p>
          <p>Sound: {state.soundPreference}</p>
        </div>
      </Card>
      <p className="text-sm text-gray-600 text-center mt-2">
        Click 'Complete' to start your productivity journey!
      </p>
    </div>
  );
};
