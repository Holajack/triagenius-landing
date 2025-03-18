
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
    setIsStartDialogOpen(false);
    setIsQuizActive(true);
    
    // Start with the first learning style in the order
    const firstStyle = styleOrder[0];
    setCurrentStyle(firstStyle);
    await fetchQuestionsForStyle(firstStyle);
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
          
          // Save results to database (you could implement this)
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
  
  // Get the dominant learning style
  const getDominantStyle = () => {
    return Object.entries(quizResults)
      .sort((a, b) => b[1] - a[1])[0][0] as LearningStyle;
  };
  
  // Get normalized percentages
  const getNormalizedResults = () => {
    const total = Object.values(quizResults).reduce((sum, val) => sum + val, 0);
    return Object.entries(quizResults).reduce((obj, [key, value]) => {
      obj[key as LearningStyle] = Math.round((value / total) * 100);
      return obj;
    }, {} as Record<LearningStyle, number>);
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
          onClick={() => setIsStartDialogOpen(true)}
          disabled={isQuizActive}
        >
          <Book className="h-4 w-4" />
          <span>Start The Quiz</span>
        </Button>
        <p className="text-sm text-muted-foreground mt-2">
          Takes approximately 15 minutes to complete
        </p>
      </div>
      
      {/* Quiz Start Dialog */}
      <Dialog open={isStartDialogOpen} onOpenChange={setIsStartDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Start Learning Style Quiz</DialogTitle>
            <DialogDescription>
              This AI-powered quiz will help determine your optimal learning style by testing you in five different ways: Physical, Auditory, Visual, Logical, and Vocal.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <p>The quiz consists of 5 sections with 5 questions each. It will take approximately 15-20 minutes to complete.</p>
            <p>Your results will help customize your learning experience in our system.</p>
          </div>
          
          <DialogFooter>
            <Button type="button" onClick={() => setIsStartDialogOpen(false)} variant="outline">
              Cancel
            </Button>
            <Button type="button" onClick={startQuiz}>
              Begin Quiz
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Active Quiz */}
      {isQuizActive && currentStyle && (
        <div className="mt-6 space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium flex items-center gap-2">
                {getStyleIcon(currentStyle)}
                {currentStyle} Learning Section
              </h3>
              <span className="text-sm text-muted-foreground">
                Question {currentQuestionIndex + 1} of {currentQuestions.length}
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
          
          {isLoading ? (
            <div className="h-64 flex items-center justify-center">
              <p>Loading questions...</p>
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                {currentQuestions[currentQuestionIndex] && (
                  <div className="space-y-6">
                    <h4 className="text-xl font-medium">{currentQuestions[currentQuestionIndex].question}</h4>
                    
                    <RadioGroup value={selectedAnswer || ""} onValueChange={handleAnswerSelect}>
                      {currentQuestions[currentQuestionIndex].options.map((option, index) => (
                        <div key={index} className="flex items-center space-x-2 py-2">
                          <RadioGroupItem value={option} id={`option-${index}`} />
                          <Label htmlFor={`option-${index}`} className="flex-1">{option}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                    
                    <Button 
                      onClick={handleNextQuestion} 
                      disabled={selectedAnswer === null}
                      className="w-full"
                    >
                      {currentQuestionIndex < currentQuestions.length - 1 ? "Next Question" : 
                        completedStyles.length < 4 ? "Next Section" : "Complete Quiz"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
      
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
                  {getStyleIcon(getDominantStyle())}
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
                          {getStyleIcon(style as LearningStyle)}
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
            <Button type="button" onClick={() => setIsResultsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LearningStyleQuiz;
