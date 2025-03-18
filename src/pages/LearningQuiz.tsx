
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { 
  Hand, 
  Headphones, 
  Eye, 
  Lightbulb, 
  PencilLine, 
  Brain, 
  ArrowRight, 
  LucideIcon 
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/hooks/use-user";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import NavigationBar from "@/components/dashboard/NavigationBar";
import PageHeader from "@/components/common/PageHeader";

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

type StyleConfig = {
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
};

const styleConfigs: Record<LearningStyle, StyleConfig> = {
  Physical: {
    title: "Physical Learning",
    description: "Learn by doing and interacting",
    icon: Hand,
    color: "bg-amber-100"
  },
  Auditory: {
    title: "Auditory Learning",
    description: "Learn by listening and hearing",
    icon: Headphones,
    color: "bg-blue-100"
  },
  Visual: {
    title: "Visual Learning",
    description: "Learn through images and spatial relationships",
    icon: Eye,
    color: "bg-green-100"
  },
  Logical: {
    title: "Logical Learning",
    description: "Learn through reasoning and systems",
    icon: Lightbulb,
    color: "bg-purple-100"
  },
  Vocal: {
    title: "Vocal Learning",
    description: "Learn by speaking and explaining concepts",
    icon: PencilLine,
    color: "bg-rose-100"
  }
};

const LearningQuiz = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [currentStyle, setCurrentStyle] = useState<LearningStyle>('Physical');
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
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState("Preparing your learning assessment...");
  const [responseTimers, setResponseTimers] = useState<Record<number, number>>({});
  const [startTime, setStartTime] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  
  // Reference to track if component is mounted
  const isMounted = useRef(true);
  
  // Initialize the quiz on component mount
  useEffect(() => {
    if (!user) {
      toast.error("Please log in to take the quiz");
      navigate("/bonuses");
      return;
    }
    
    // Load the first style questions
    fetchQuestionsForStyle('Physical');
    
    return () => {
      isMounted.current = false;
    };
  }, [user, navigate]);
  
  const fetchQuestionsForStyle = async (style: LearningStyle) => {
    if (!user) return;
    
    setIsLoading(true);
    setLoadingMessage(`Preparing ${style.toLowerCase()} learning assessment...`);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-learning-quiz', {
        body: { quizType: style, userId: user.id }
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (data && data.questions && isMounted.current) {
        setCurrentQuestions(data.questions);
        setCurrentQuestionIndex(0);
        setSelectedAnswer(null);
        setShowExplanation(false);
        setStartTime(Date.now());
        setCurrentStyle(style);
      }
    } catch (error) {
      console.error("Error fetching questions:", error);
      if (isMounted.current) {
        toast.error("Failed to load quiz questions. Please try again.");
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  };
  
  const handleAnswerSelect = (answer: string) => {
    if (showExplanation) return;
    
    setSelectedAnswer(answer);
    if (startTime) {
      const responseTime = Date.now() - startTime;
      setResponseTimers({
        ...responseTimers,
        [currentQuestionIndex]: responseTime
      });
    }
    
    // Don't show that the answer is correct/incorrect
    // Just record it and add to score behind the scenes
    const isCorrect = answer === currentQuestions[currentQuestionIndex]?.correctAnswer;
    const responseTime = Date.now() - (startTime || Date.now());
    
    // Calculate score - weight correctness more heavily than speed
    const responseTimeFactor = Math.max(0.1, Math.min(1.0, 5000 / responseTime));
    const pointsForQuestion = isCorrect ? (1 + responseTimeFactor) : (responseTimeFactor * 0.5);
    
    setQuizResults(prev => ({
      ...prev,
      [currentStyle]: prev[currentStyle] + pointsForQuestion
    }));
    
    // Auto-advance after a slight delay
    setTimeout(() => {
      handleNextQuestion();
    }, 350);
  };
  
  const handleNextQuestion = () => {
    if (selectedAnswer === null && !showExplanation) return;
    
    if (showExplanation) {
      setShowExplanation(false);
      
      if (currentQuestionIndex < currentQuestions.length - 1) {
        // Move to the next question
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setSelectedAnswer(null);
        setStartTime(Date.now());
      } else {
        moveToNextSection();
      }
      return;
    }
    
    if (currentQuestionIndex < currentQuestions.length - 1) {
      // Move to the next question
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setStartTime(Date.now());
    } else {
      moveToNextSection();
    }
  };
  
  const moveToNextSection = () => {
    // This learning style section is complete
    setCompletedStyles([...completedStyles, currentStyle]);
    
    // Find the next style to test
    const nextStyleIndex = styleOrder.findIndex(s => s === currentStyle) + 1;
    
    if (nextStyleIndex < styleOrder.length) {
      // Move to the next learning style
      const nextStyle = styleOrder[nextStyleIndex];
      fetchQuestionsForStyle(nextStyle);
    } else {
      // All styles completed, show results
      setIsResultsDialogOpen(true);
      
      // Save results to database
      saveQuizResults();
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
      
      // Get primary style (highest percentage)
      const primaryStyle = Object.entries(normalizedResults)
        .sort((a, b) => b[1] - a[1])[0][0];
      
      // Save to Supabase
      const { error } = await supabase
        .from('learning_styles')
        .upsert({
          user_id: user.id,
          physical: normalizedResults.Physical,
          auditory: normalizedResults.Auditory,
          visual: normalizedResults.Visual,
          logical: normalizedResults.Logical,
          vocal: normalizedResults.Vocal,
          primary_style: primaryStyle,
          created_at: new Date().toISOString()
        });
      
      if (error) {
        console.error("Error saving learning styles:", error);
        toast.error("Failed to save your results. Please try again.");
        return;
      }
      
      toast.success("Your learning profile has been saved!");
    } catch (error) {
      console.error("Error saving quiz results:", error);
      toast.error("Failed to save your results. Please try again.");
    }
  };
  
  // Calculate progress percentage across all sections
  const progressPercentage = ((completedStyles.length * 100) + 
    ((currentQuestionIndex / Math.max(1, currentQuestions.length)) * 20)) / 5;
  
  // Get normalized percentages for results
  const getNormalizedResults = () => {
    const total = Object.values(quizResults).reduce((sum, val) => sum + val, 0);
    return Object.entries(quizResults).reduce((obj, [key, value]) => {
      obj[key as LearningStyle] = Math.round((value / total) * 100);
      return obj;
    }, {} as Record<LearningStyle, number>);
  };
  
  // Get the dominant learning style
  const getDominantStyle = () => {
    return Object.entries(getNormalizedResults())
      .sort((a, b) => b[1] - a[1])[0][0] as LearningStyle;
  };
  
  // Get learning style recommendations
  const getRecommendations = (style: LearningStyle) => {
    switch(style) {
      case 'Physical':
        return "Try hands-on activities, movement while studying, and tactile learning tools.";
      case 'Auditory':
        return "Use recordings, participate in discussions, and read aloud when studying.";
      case 'Visual':
        return "Use charts, mind maps, color-coding, and watch educational videos.";
      case 'Logical':
        return "Organize information in systems, use problem-solving approaches, and find patterns.";
      case 'Vocal':
        return "Explain concepts to others, participate in group discussions, and use verbal repetition.";
    }
  };
  
  // Current learning style icon and color
  const CurrentIcon = styleConfigs[currentStyle]?.icon || Hand;
  const currentColor = styleConfigs[currentStyle]?.color || "bg-slate-100";
  
  // Handle results dialog close
  const handleResultsDialogClose = () => {
    setIsResultsDialogOpen(false);
    navigate("/bonuses");
  };
  
  return (
    <div className="container max-w-4xl px-4 pb-24">
      <PageHeader 
        title="Learning Style Assessment" 
        subtitle="Discover your optimal way of learning"
      />
      
      <div className="mt-4">
        {/* Progress bar and section indicator */}
        <div className="space-y-2 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CurrentIcon className="h-5 w-5" />
              <h2 className="text-lg font-medium">
                {styleConfigs[currentStyle].title}
              </h2>
            </div>
            <span className="text-sm text-muted-foreground">
              Question {currentQuestionIndex + 1} of {currentQuestions.length}
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Section {completedStyles.length + 1} of 5</span>
            <span>{Math.round(progressPercentage)}% Complete</span>
          </div>
        </div>
        
        {isLoading ? (
          <div className="min-h-[400px] flex flex-col items-center justify-center p-8">
            <div className="animate-spin mb-4">
              <Brain className="h-12 w-12 text-primary" />
            </div>
            <p className="text-lg font-medium">{loadingMessage}</p>
            <p className="text-sm text-muted-foreground mt-2">This may take a moment...</p>
          </div>
        ) : (
          <Card className={`${currentColor} border-0 overflow-hidden`}>
            <CardContent className="p-6">
              {currentQuestions[currentQuestionIndex] && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <CurrentIcon className="h-6 w-6" />
                      <h3 className="text-xl font-medium">
                        {styleConfigs[currentStyle].description}
                      </h3>
                    </div>
                    <h4 className="text-lg">
                      {currentQuestions[currentQuestionIndex].question}
                    </h4>
                  </div>
                  
                  <RadioGroup 
                    value={selectedAnswer || ""} 
                    onValueChange={handleAnswerSelect}
                    className="space-y-3"
                    disabled={showExplanation}
                  >
                    {currentQuestions[currentQuestionIndex].options.map((option, index) => (
                      <div key={index} className="flex items-start space-x-2 p-3 rounded-md bg-white/80 hover:bg-white transition-colors">
                        <RadioGroupItem value={option} id={`option-${index}`} className="mt-1" />
                        <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                          {option}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                  
                  {showExplanation && (
                    <div className="p-4 rounded-md bg-white/90">
                      <h5 className="font-medium mb-1">Explanation</h5>
                      <p className="text-sm">
                        {currentQuestions[currentQuestionIndex].explanation}
                      </p>
                    </div>
                  )}
                  
                  <Button 
                    onClick={handleNextQuestion} 
                    disabled={selectedAnswer === null && !showExplanation}
                    className="w-full"
                  >
                    {currentQuestionIndex < currentQuestions.length - 1 ? 
                      "Next Question" : completedStyles.length < 4 ? 
                      "Next Section" : "Complete Quiz"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Results Dialog */}
      <Dialog open={isResultsDialogOpen} onOpenChange={setIsResultsDialogOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Your Learning Style Results
            </DialogTitle>
            <DialogDescription>
              Based on your responses, we've determined your optimal learning styles and preferences.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <h3 className="text-lg font-medium mb-2">Primary Learning Style</h3>
                <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/10">
                  {styleConfigs[getDominantStyle()].icon({ className: "h-6 w-6 text-primary" })}
                  <div>
                    <p className="font-medium">{getDominantStyle()} Learner</p>
                    <p className="text-sm text-muted-foreground">
                      {getNormalizedResults()[getDominantStyle()]}% preference
                    </p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Recommendations</h3>
                <p className="text-sm">{getRecommendations(getDominantStyle())}</p>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-3">Learning Style Breakdown</h3>
              <div className="space-y-3">
                {Object.entries(getNormalizedResults())
                  .sort(([, a], [, b]) => b - a)
                  .map(([style, percentage]) => (
                    <div key={style} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <div className="flex items-center gap-2">
                          {styleConfigs[style as LearningStyle].icon({ className: "h-5 w-5" })}
                          <span>{style}</span>
                        </div>
                        <span>{percentage}%</span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  ))}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" onClick={handleResultsDialogClose}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <NavigationBar />
    </div>
  );
};

export default LearningQuiz;
