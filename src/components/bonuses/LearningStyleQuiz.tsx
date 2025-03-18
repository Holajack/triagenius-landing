
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Book } from "lucide-react";
import { useUser } from "@/hooks/use-user";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

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
          Takes approximately 15 minutes to complete
        </p>
      </div>
    </div>
  );
};

export default LearningStyleQuiz;
