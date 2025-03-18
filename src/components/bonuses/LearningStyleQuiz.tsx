
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Brain, Book, PencilLine, Headphones, Eye, Hand, Lightbulb } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/hooks/use-user";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

type LearningStyle = 'Physical' | 'Auditory' | 'Visual' | 'Logical' | 'Vocal';

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  learningStyleIndicator: string;
}

interface QuizResults {
  Physical: number;
  Auditory: number;
  Visual: number;
  Logical: number;
  Vocal: number;
}

const LearningStyleQuiz = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [isStartDialogOpen, setIsStartDialogOpen] = useState(false);
  const [isQuizActive, setIsQuizActive] = useState(false);
  const [currentStyle, setCurrentStyle] = useState<LearningStyle | null>(null);
  const [completedStyles, setCompletedStyles] = useState<LearningStyle[]>([]);
  const [styleOrder] = useState<LearningStyle[]>(['Physical', 'Auditory', 'Visual', 'Logical', 'Vocal']);
  const [currentQuestions, setCurrentQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [quizResults, setQuizResults] = useState<QuizResults>({
    Physical: 0,
    Auditory: 0,
    Visual: 0,
    Logical: 0,
    Vocal: 0
  });
  const [isResultsDialogOpen, setIsResultsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [responseTimers, setResponseTimers] = useState<Record<number, number>>({});
  const [startTime, setStartTime] = useState<number | null>(null);
  
  const startQuiz = async () => {
    if (!user) {
      toast.error("Please log in to take the quiz");
      return;
    }
    
    // Navigate to quiz page instead of showing dialog
    navigate("/learning-quiz");
  };
  
  const fetchQuestionsForStyle = async (style: LearningStyle) => {
    if (!user) {
      toast.error("Please log in to take the quiz");
      return;
    }
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-learning-quiz', {
        body: { quizType: style, userId: user.id }
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (data && data.questions) {
        setCurrentQuestions(data.questions);
        setCurrentQuestionIndex(0);
        setSelectedAnswer(null);
        setStartTime(Date.now());
      }
    } catch (error) {
      console.error("Error fetching questions:", error);
      toast.error("Failed to load quiz questions. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer);
    if (startTime && currentStyle) {
      const responseTime = Date.now() - startTime;
      setResponseTimers({
        ...responseTimers,
        [currentQuestionIndex]: responseTime
      });
    }
  };
  
  const handleNextQuestion = () => {
    if (selectedAnswer === null) return;
    
    // Update score for the current style based on correct answer and response time
    if (currentStyle && currentQuestions[currentQuestionIndex]) {
      const isCorrect = selectedAnswer === currentQuestions[currentQuestionIndex].correctAnswer;
      const responseTime = responseTimers[currentQuestionIndex] || 5000; // Default to 5s if not recorded
      
      // Calculate score - weight correctness more heavily than speed
      // Response time factor: faster = higher score (max 1.0)
      const responseTimeFactor = Math.max(0.1, Math.min(1.0, 5000 / responseTime));
      const pointsForQuestion = isCorrect ? (1 + responseTimeFactor) : (responseTimeFactor * 0.5);
      
      setQuizResults(prev => ({
        ...prev,
        [currentStyle]: prev[currentStyle] + pointsForQuestion
      }));
    }
    
    if (currentQuestionIndex < currentQuestions.length - 1) {
      // Move to the next question
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setStartTime(Date.now());
    } else {
      // This learning style section is complete
      if (currentStyle) {
        setCompletedStyles([...completedStyles, currentStyle]);
        
        // Find the next style to test
        const nextStyleIndex = styleOrder.findIndex(s => s === currentStyle) + 1;
        
        if (nextStyleIndex < styleOrder.length) {
          // Move to the next learning style
          const nextStyle = styleOrder[nextStyleIndex];
          setCurrentStyle(nextStyle);
          fetchQuestionsForStyle(nextStyle);
        } else {
          // All styles completed, show results
          setIsQuizActive(false);
          setIsResultsDialogOpen(true);
          
          // Save results to database
          saveQuizResults();
        }
      }
    }
  };
  
  const saveQuizResults = async () => {
    if (!user) return;
    
    try {
      // Normalize scores to percentages that add up to 100%
      const total = Object.values(quizResults).reduce((sum, val) => sum + val, 0);
      const normalizedResults = Object.entries(quizResults).reduce((obj, [key, value]) => {
        obj[key as LearningStyle] = Math.round((value / total) * 100);
        return obj;
      }, {} as Record<LearningStyle, number>);
      
      // Here you could save the results to your database
      // This is just a placeholder for now
      console.log("Normalized quiz results:", normalizedResults);
      
      // You could also update the user's learning style preference
      const primaryStyle = Object.entries(normalizedResults)
        .sort((a, b) => b[1] - a[1])[0][0];
        
      console.log("Primary learning style:", primaryStyle);
    } catch (error) {
      console.error("Error saving quiz results:", error);
    }
  };
  
  const progressPercentage = isQuizActive 
    ? ((completedStyles.length * 100) + ((currentQuestionIndex / currentQuestions.length) * 20)) / 5 
    : 0;
  
  // Learning style icons
  const getStyleIcon = (style: LearningStyle) => {
    switch(style) {
      case 'Physical': return <Hand className="h-6 w-6" />;
      case 'Auditory': return <Headphones className="h-6 w-6" />;
      case 'Visual': return <Eye className="h-6 w-6" />;
      case 'Logical': return <Lightbulb className="h-6 w-6" />;
      case 'Vocal': return <PencilLine className="h-6 w-6" />;
    }
  };
  
  return (
    <div className="w-full">
      {/* Start Quiz Button */}
      <div className="mt-8 text-center">
        <Button 
          size="lg" 
          className="gap-2"
          onClick={startQuiz}
          disabled={isQuizActive}
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
