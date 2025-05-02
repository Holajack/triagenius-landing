
import { Button } from "@/components/ui/button";
import { Book, Clock, AlertTriangle } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { cn } from "@/lib/utils";

const LearningStyleQuiz = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const { state } = useOnboarding();
  
  const startQuiz = () => {
    if (!user) {
      toast.error("Please log in to take the quiz");
      return;
    }
    
    // Save environment preference before navigating
    if (state.environment) {
      localStorage.setItem('environment', state.environment);
    }
    
    // Navigate to quiz page
    navigate("/learning-quiz");
  };
  
  // Get environment-specific button class
  const getEnvButtonClass = () => {
    switch (state.environment) {
      case 'office': return "bg-blue-600 hover:bg-blue-700";
      case 'park': return "bg-green-600 hover:bg-green-700";
      case 'home': return "bg-orange-500 hover:bg-orange-600";
      case 'coffee-shop': return "bg-amber-500 hover:bg-amber-600";
      case 'library': return "bg-gray-600 hover:bg-gray-700";
      default: return "bg-indigo-600 hover:bg-indigo-700";
    }
  };
  
  return (
    <div className="w-full">
      {/* Quiz Introduction Card */}
      <Card className={cn(
        "mb-6 border-0",
        state.environment === 'office' ? "bg-gradient-to-br from-blue-50 to-blue-50/50 dark:from-blue-950/30 dark:to-blue-950/10" :
        state.environment === 'park' ? "bg-gradient-to-br from-green-50 to-green-50/50 dark:from-green-950/30 dark:to-green-950/10" :
        state.environment === 'home' ? "bg-gradient-to-br from-orange-50 to-orange-50/50 dark:from-orange-950/30 dark:to-orange-950/10" :
        state.environment === 'coffee-shop' ? "bg-gradient-to-br from-amber-50 to-amber-50/50 dark:from-amber-950/30 dark:to-amber-950/10" :
        state.environment === 'library' ? "bg-gradient-to-br from-gray-50 to-gray-50/50 dark:from-gray-950/30 dark:to-gray-950/10" :
        "bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30"
      )}>
        <CardContent className="p-6">
          <h3 className="text-xl font-medium mb-2">Discover Your Unique Learning Style</h3>
          <p className="text-muted-foreground mb-4">
            This comprehensive assessment analyzes your responses to questions about how you learn
            best. The quiz presents 40 numbered questions with a 4-point scale from Strongly Disagree to Strongly Agree.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">45 minutes to complete</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <span className="text-sm text-muted-foreground">All questions are mandatory</span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Start Quiz Button */}
      <div className="mt-8 text-center">
        <Button 
          size="lg" 
          className={cn("gap-2 text-white", getEnvButtonClass())}
          onClick={startQuiz}
        >
          <Book className="h-4 w-4" />
          <span>Start The Quiz</span>
        </Button>
        <p className="text-sm text-muted-foreground mt-2">
          Discover your optimal learning style and get personalized recommendations
        </p>
      </div>
    </div>
  );
};

export default LearningStyleQuiz;
