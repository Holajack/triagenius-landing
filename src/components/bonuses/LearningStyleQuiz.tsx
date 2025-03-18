
import { Button } from "@/components/ui/button";
import { Book, Clock, AlertTriangle } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";

const LearningStyleQuiz = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  
  const startQuiz = () => {
    if (!user) {
      toast.error("Please log in to take the quiz");
      return;
    }
    
    // Navigate to quiz page
    navigate("/learning-quiz");
  };
  
  return (
    <div className="w-full">
      {/* Quiz Introduction Card */}
      <Card className="mb-6 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border-0">
        <CardContent className="p-6">
          <h3 className="text-xl font-medium mb-2">Discover Your Unique Learning Style</h3>
          <p className="text-muted-foreground mb-4">
            This comprehensive assessment will help you identify your learning preferences 
            across five dimensions: Physical, Vocal, Auditory, Visual, and Logical.
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
          className="gap-2"
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
