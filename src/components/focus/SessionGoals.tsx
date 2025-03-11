
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Target } from "lucide-react";

export const SessionGoals = () => {
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Target className="h-4 w-4" />
          Session Goals
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Focus on your primary task. Your progress is being tracked and will sync when you're back online.
        </p>
      </CardContent>
    </Card>
  );
};
