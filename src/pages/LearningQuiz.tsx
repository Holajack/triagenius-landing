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
  ArrowRight,
  ArrowLeft,
  Brain,
  type LucideIcon,
  Save,
  Download,
  AlertTriangle
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/hooks/use-user";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import NavigationBar from "@/components/dashboard/NavigationBar";
import PageHeader from "@/components/common/PageHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

type LearningStyle = 'Physical' | 'Vocal' | 'Auditory' | 'Visual' | 'Logical';

interface LearningQuestion {
  id: number;
  text: string;
  category: LearningStyle;
}

type UserAnswers = Record<number, number>;

type StyleConfig = {
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
};

const styleConfigs: Record<LearningStyle, StyleConfig> = {
  Physical: {
    title: "Physical Learning",
    description: "Learn by doing and interacting with physical objects",
    icon: Headphones,
    color: "bg-amber-100"
  },
  Vocal: {
    title: "Vocal Learning",
    description: "Learn by speaking and explaining concepts",
    icon: Headphones,
    color: "bg-rose-100"
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
    icon: Headphones,
    color: "bg-green-100"
  },
  Logical: {
    title: "Logical Learning",
    description: "Learn through reasoning and systems",
    icon: Headphones,
    color: "bg-purple-100"
  }
};

// All 40 questions defined exactly as in the prompt
const allQuestions: LearningQuestion[] = [
  // Physical/Kinesthetic questions
  { id: 1, text: "I prefer assembling furniture myself rather than watching a tutorial.", category: "Physical" },
  { id: 2, text: "Role-playing or simulations help me grasp complex topics.", category: "Physical" },
  { id: 3, text: "I retain information best when I can move around while learning.", category: "Physical" },
  { id: 4, text: "Hands-on experiments in labs are more effective for me than lectures.", category: "Physical" },
  { id: 5, text: "Taking frequent breaks to stretch or walk helps me learn better.", category: "Physical" },
  { id: 6, text: "I use gestures or physical objects to explain my ideas.", category: "Physical" },
  { id: 7, text: "I remember things better after doing them rather than just reading about them.", category: "Physical" },
  { id: 8, text: "Learning through physical activities like sports or dance is effective for me.", category: "Physical" },
  
  // Vocal/Linguistic questions
  { id: 9, text: "Explaining concepts out loud helps me memorize them.", category: "Vocal" },
  { id: 10, text: "I enjoy debates or group discussions more than silent study.", category: "Vocal" },
  { id: 11, text: "Writing summaries or teaching others improves my understanding.", category: "Vocal" },
  { id: 12, text: "I often talk to myself when solving problems.", category: "Vocal" },
  { id: 13, text: "I prefer reading aloud rather than silently.", category: "Vocal" },
  { id: 14, text: "Participating in study groups helps me learn better.", category: "Vocal" },
  { id: 15, text: "I use rhymes or wordplay to remember information.", category: "Vocal" },
  { id: 16, text: "Writing essays or journals is an effective way for me to learn.", category: "Vocal" },
  
  // Auditory questions
  { id: 17, text: "I remember song lyrics easily.", category: "Auditory" },
  { id: 18, text: "Podcasts or audiobooks are more engaging than textbooks.", category: "Auditory" },
  { id: 19, text: "Repeating information aloud helps me retain it.", category: "Auditory" },
  { id: 20, text: "I can follow verbal instructions without needing written notes.", category: "Auditory" },
  { id: 21, text: "Background music improves my concentration while studying.", category: "Auditory" },
  { id: 22, text: "I prefer listening to lectures over reading assignments.", category: "Auditory" },
  { id: 23, text: "Mnemonic devices involving sound or rhythm help me remember.", category: "Auditory" },
  { id: 24, text: "I easily concentrate on spoken information, like in meetings.", category: "Auditory" },
  
  // Visual/Spatial questions
  { id: 25, text: "Diagrams or mind maps make complex ideas clearer.", category: "Visual" },
  { id: 26, text: "I can easily visualize places I've visited once.", category: "Visual" },
  { id: 27, text: "Color-coding notes improves my recall.", category: "Visual" },
  { id: 28, text: "Watching demonstrations is better than listening to explanations.", category: "Visual" },
  { id: 29, text: "Flashcards with images help me study effectively.", category: "Visual" },
  { id: 30, text: "I can mentally visualize charts or graphs after seeing them.", category: "Visual" },
  { id: 31, text: "Sketching ideas helps me understand them better.", category: "Visual" },
  { id: 32, text: "I remember faces better than names.", category: "Visual" },
  
  // Logical/Mathematical questions
  { id: 33, text: "I enjoy solving puzzles like Sudoku or chess.", category: "Logical" },
  { id: 34, text: "I look for patterns in information to understand it better.", category: "Logical" },
  { id: 35, text: "Step-by-step instructions are more helpful than trial-and-error.", category: "Logical" },
  { id: 36, text: "Categorizing information helps me see relationships.", category: "Logical" },
  { id: 37, text: "Structured outlines are more useful than free-form notes.", category: "Logical" },
  { id: 38, text: "Analyzing data or statistics helps me draw conclusions.", category: "Logical" },
  { id: 39, text: "Figuring out how things work systematically is enjoyable.", category: "Logical" },
  { id: 40, text: "I use lists and schedules to organize my tasks effectively.", category: "Logical" }
];

// Shuffle questions to mix them up across categories
const shuffledQuestions = [...allQuestions].sort(() => Math.random() - 0.5);

// Updated likert options with Neutral removed
const likertOptions = [
  { value: "1", label: "Strongly Disagree" },
  { value: "2", label: "Disagree" },
  { value: "4", label: "Agree" },
  { value: "5", label: "Strongly Agree" }
];

const STORAGE_KEY = "learning_quiz_progress";

const LearningQuiz = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [userAnswers, setUserAnswers] = useState<UserAnswers>({});
  const [isResultsDialogOpen, setIsResultsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resultsCalculated, setResultsCalculated] = useState<Record<LearningStyle, number> | null>(null);
  const [isExitDialogOpen, setIsExitDialogOpen] = useState(false);
  const [isMissingAnswers, setIsMissingAnswers] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  
  // Questions per page (pagination)
  const QUESTIONS_PER_PAGE = 8;
  const totalPages = Math.ceil(shuffledQuestions.length / QUESTIONS_PER_PAGE);
  
  // Get questions for current page
  const getCurrentPageQuestions = () => {
    const startIndex = currentPage * QUESTIONS_PER_PAGE;
    return shuffledQuestions.slice(startIndex, startIndex + QUESTIONS_PER_PAGE);
  };
  
  // Calculate completion percentage
  const totalQuestions = allQuestions.length;
  const answeredQuestions = Object.keys(userAnswers).length;
  const completionPercentage = (answeredQuestions / totalQuestions) * 100;
  
  // Load saved progress from localStorage
  useEffect(() => {
    if (!user) {
      toast.error("Please log in to take the quiz");
      navigate("/bonuses");
      return;
    }
    
    const savedProgress = localStorage.getItem(`${STORAGE_KEY}_${user.id}`);
    if (savedProgress) {
      try {
        const parsed = JSON.parse(savedProgress);
        setUserAnswers(parsed.answers || {});
        if (parsed.page) {
          setCurrentPage(parsed.page);
        }
      } catch (error) {
        console.error("Error loading saved progress:", error);
      }
    }
  }, [user, navigate]);
  
  // Save progress to localStorage whenever answers change
  useEffect(() => {
    if (user) {
      localStorage.setItem(`${STORAGE_KEY}_${user.id}`, JSON.stringify({
        answers: userAnswers,
        page: currentPage,
        timestamp: new Date().toISOString()
      }));
    }
  }, [userAnswers, currentPage, user]);
  
  const handleAnswer = (questionId: number, value: string) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: parseInt(value)
    }));
  };
  
  const handleNextPage = () => {
    // Check if all questions on current page are answered
    const currentQuestions = getCurrentPageQuestions();
    const unansweredQuestions = currentQuestions.filter(q => userAnswers[q.id] === undefined);
    
    if (unansweredQuestions.length > 0) {
      setIsMissingAnswers(true);
      toast.warning("Please answer all questions on this page before proceeding.");
      return;
    }
    
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
      window.scrollTo(0, 0); // Scroll to top for new page
      setIsMissingAnswers(false);
    } else {
      // All pages completed
      calculateResults();
    }
  };
  
  const handlePreviousPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
      window.scrollTo(0, 0); // Scroll to top for new page
    }
  };
  
  const calculateResults = () => {
    setIsLoading(true);
    
    // Check if all questions are answered
    const unansweredQuestions = allQuestions.filter(q => userAnswers[q.id] === undefined);
    if (unansweredQuestions.length > 0) {
      setIsMissingAnswers(true);
      setIsLoading(false);
      toast.error(`Please answer all ${unansweredQuestions.length} unanswered questions before submitting.`);
      return;
    }
    
    // Calculate scores for each learning style
    const results: Record<LearningStyle, number> = {
      Physical: 0,
      Vocal: 0,
      Auditory: 0,
      Visual: 0,
      Logical: 0
    };
    
    allQuestions.forEach(question => {
      const answer = userAnswers[question.id];
      if (answer !== undefined) {
        results[question.category] += answer;
      }
    });
    
    setResultsCalculated(results);
    saveResultsToDatabase(results);
  };
  
  const saveResultsToDatabase = async (results: Record<LearningStyle, number>) => {
    if (!user) {
      toast.error("Please log in to save your results");
      setIsLoading(false);
      return;
    }
    
    try {
      // Calculate percentages for visualization
      const total = Object.values(results).reduce((sum, val) => sum + val, 0);
      const normalizedResults = Object.entries(results).reduce((obj, [key, value]) => {
        obj[key as LearningStyle] = Math.round((value / total) * 100);
        return obj;
      }, {} as Record<LearningStyle, number>);
      
      const primaryStyle = Object.entries(normalizedResults)
        .sort((a, b) => b[1] - a[1])[0][0];
      
      console.log("Saving learning metrics to database for user:", user.id);
      console.log("Normalized results:", normalizedResults);
      
      const focusDistributionData = [
        { name: "Physical", value: normalizedResults.Physical },
        { name: "Vocal", value: normalizedResults.Vocal },
        { name: "Auditory", value: normalizedResults.Auditory },
        { name: "Visual", value: normalizedResults.Visual },
        { name: "Logical", value: normalizedResults.Logical }
      ];
      
      console.log("Focus distribution data:", focusDistributionData);
      
      // First, check if a record already exists for this user
      const { data: existingRecord, error: checkError } = await supabase
        .from('learning_metrics')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (checkError) {
        console.error("Error checking existing records:", checkError);
        toast.error(`Database query failed: ${checkError.message}`);
        setIsLoading(false);
        return;
      }
      
      let dbOperation;
      
      // If a record exists, update it; otherwise insert a new one
      if (existingRecord) {
        console.log("Updating existing record for user:", user.id);
        dbOperation = supabase
          .from('learning_metrics')
          .update({
            cognitive_analytical: normalizedResults.Logical,
            cognitive_memory: normalizedResults.Visual,
            cognitive_problem_solving: normalizedResults.Physical,
            cognitive_creativity: normalizedResults.Vocal,
            focus_distribution: focusDistributionData,
            time_of_day_data: [{ time: new Date().toISOString(), primary_style: primaryStyle }]
          })
          .eq('user_id', user.id);
      } else {
        console.log("Creating new record for user:", user.id);
        dbOperation = supabase
          .from('learning_metrics')
          .insert({
            user_id: user.id,
            cognitive_analytical: normalizedResults.Logical,
            cognitive_memory: normalizedResults.Visual,
            cognitive_problem_solving: normalizedResults.Physical,
            cognitive_creativity: normalizedResults.Vocal,
            focus_distribution: focusDistributionData,
            time_of_day_data: [{ time: new Date().toISOString(), primary_style: primaryStyle }]
          });
      }
      
      const { data, error } = await dbOperation;
      
      if (error) {
        console.error("Error saving learning metrics:", error);
        console.error("Error details:", error.message, error.details, error.hint);
        toast.error(`Failed to save your results: ${error.message}`);
        setIsLoading(false);
        return;
      }
      
      console.log("Learning metrics saved successfully:", data);
      
      // Also save to the learning_styles table for direct access
      const { error: stylesError } = await supabase
        .from('learning_styles')
        .upsert({
          user_id: user.id,
          physical: normalizedResults.Physical,
          vocal: normalizedResults.Vocal,
          auditory: normalizedResults.Auditory,
          visual: normalizedResults.Visual,
          logical: normalizedResults.Logical,
          primary_style: primaryStyle
        });
        
      if (stylesError) {
        console.error("Error saving to learning_styles:", stylesError);
        // This is not critical, so just log it without showing an error toast
      }
      
      setIsLoading(false);
      setIsResultsDialogOpen(true);
      toast.success("Your learning profile has been saved!");
      
      // Clear saved progress after successful submission
      localStorage.removeItem(`${STORAGE_KEY}_${user.id}`);
    } catch (error) {
      console.error("Error saving quiz results:", error);
      toast.error("Failed to save your results. Please try again.");
      setIsLoading(false);
    }
  };
  
  const getRecommendations = (style: LearningStyle) => {
    switch(style) {
      case 'Physical':
        return [
          "Try standing or pacing while reviewing material",
          "Use physical objects or models when studying",
          "Take frequent breaks to move around",
          "Create flashcards and manipulate them physically",
          "Participate in role-playing exercises"
        ];
      case 'Vocal':
        return [
          "Teach concepts to others, even if imaginary",
          "Record yourself explaining topics and listen back",
          "Join study groups for discussion opportunities",
          "Create songs or rhymes about what you're learning",
          "Read important passages aloud"
        ];
      case 'Auditory':
        return [
          "Listen to lectures or audiobooks",
          "Use text-to-speech for reading materials",
          "Study with background music (without lyrics)",
          "Record lectures and listen to them multiple times",
          "Use sound-based mnemonic devices"
        ];
      case 'Visual':
        return [
          "Create mind maps and diagrams",
          "Use color-coding in your notes",
          "Watch video tutorials instead of reading instructions",
          "Visualize concepts as mental images",
          "Use charts, graphs, and visual aids"
        ];
      case 'Logical':
        return [
          "Organize information in numbered lists or hierarchies",
          "Look for patterns and connections between concepts",
          "Create systems and frameworks for organizing knowledge",
          "Use step-by-step approaches to problem-solving",
          "Analyze case studies and examples"
        ];
    }
  };
  
  const getDominantStyles = () => {
    if (!resultsCalculated) return [];
    
    // Calculate total score
    const total = Object.values(resultsCalculated).reduce((sum, val) => sum + val, 0);
    
    // Create array of [style, percentage] pairs
    const stylePercentages = Object.entries(resultsCalculated)
      .map(([style, score]) => [style, Math.round((score / total) * 100)]) as [LearningStyle, number][];
    
    // Sort by percentage (descending)
    return stylePercentages.sort((a, b) => b[1] - a[1]);
  };
  
  const getPrimaryStyle = (): LearningStyle | null => {
    const dominantStyles = getDominantStyles();
    return dominantStyles.length > 0 ? dominantStyles[0][0] : null;
  };
  
  const getSecondaryStyle = (): LearningStyle | null => {
    const dominantStyles = getDominantStyles();
    return dominantStyles.length > 1 ? dominantStyles[1][0] : null;
  };
  
  const handleExitQuiz = () => {
    if (answeredQuestions > 0) {
      setIsExitDialogOpen(true);
    } else {
      navigate("/bonuses");
    }
  };
  
  const confirmExit = () => {
    navigate("/bonuses");
  };
  
  const handleDownloadResults = () => {
    if (!resultsCalculated) return;
    
    const primaryStyle = getPrimaryStyle();
    const secondaryStyle = getSecondaryStyle();
    if (!primaryStyle) return;
    
    const dominantStyles = getDominantStyles();
    
    const createContent = () => {
      return `
# Your Learning Style Profile

## Your Learning Style Breakdown
${dominantStyles.map(([style, percentage]) => 
  `- **${style}**: ${percentage}%`
).join('\n')}

## Primary Learning Style: ${primaryStyle}
${styleConfigs[primaryStyle].description}

${secondaryStyle ? 
  `## Secondary Learning Style: ${secondaryStyle}
${styleConfigs[secondaryStyle].description}` : ''}

## Recommendations for ${primaryStyle} Learners
${getRecommendations(primaryStyle).map(rec => `- ${rec}`).join('\n')}

${secondaryStyle ? 
  `## Recommendations for ${secondaryStyle} Learners
${getRecommendations(secondaryStyle).map(rec => `- ${rec}`).join('\n')}` : ''}

Generated on: ${new Date().toLocaleDateString()}
`;
    };
    
    const blob = new Blob([createContent()], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'learning-style-results.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success("Your results have been downloaded!");
  };
  
  return (
    <div className="container max-w-4xl px-4 pb-24">
      <PageHeader 
        title="Learning Style Assessment" 
        subtitle="Discover your optimal way of learning"
      />
      
      <div className="mt-4">
        <div className="space-y-2 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Headphones className="h-5 w-5" />
              <h2 className="text-lg font-medium">
                Learning Style Assessment
              </h2>
            </div>
            <Button variant="outline" size="sm" onClick={handleExitQuiz}>
              Save & Exit
            </Button>
          </div>
          <Progress value={completionPercentage} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Page {currentPage + 1} of {totalPages}</span>
            <span>{Math.round(completionPercentage)}% Complete</span>
          </div>
        </div>
        
        <Card className="bg-gray-50 dark:bg-gray-800 border-0 overflow-hidden">
          <CardContent className="p-6">
            <div className="space-y-8">
              {getCurrentPageQuestions().map((question, index) => {
                // Calculate the sequential question number for this page
                const questionNumber = currentPage * QUESTIONS_PER_PAGE + index + 1;
                
                return (
                  <div key={question.id} className="space-y-4">
                    <div className="flex">
                      <span className="font-medium mr-2">{questionNumber}.</span>
                      <h4 className="font-medium">{question.text}</h4>
                    </div>
                    
                    <RadioGroup 
                      value={userAnswers[question.id]?.toString() || ""}
                      onValueChange={(value) => handleAnswer(question.id, value)}
                      className="grid grid-cols-1 md:grid-cols-4 gap-2"
                    >
                      {likertOptions.map((option) => (
                        <div key={option.value} className="flex items-center space-x-2 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors p-3 rounded-md">
                          <RadioGroupItem value={option.value} id={`q${question.id}-opt${option.value}`} />
                          <Label 
                            htmlFor={`q${question.id}-opt${option.value}`}
                            className="flex-1 cursor-pointer text-sm"
                          >
                            {option.label}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                    
                    {isMissingAnswers && userAnswers[question.id] === undefined && (
                      <div className="text-red-500 text-sm flex items-center">
                        <AlertTriangle className="h-4 w-4 mr-1" />
                        Please answer this question
                      </div>
                    )}
                  </div>
                );
              })}
              
              <div className="flex justify-between mt-6">
                <Button
                  variant="outline"
                  onClick={handlePreviousPage}
                  disabled={currentPage === 0}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Previous Page
                </Button>
                
                <Button onClick={handleNextPage}>
                  {currentPage < totalPages - 1 ? (
                    <>
                      Next Page
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  ) : (
                    isLoading ? "Processing..." : "Complete Quiz"
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Exit Confirmation Dialog */}
      <Dialog open={isExitDialogOpen} onOpenChange={setIsExitDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save and Exit Quiz?</DialogTitle>
            <DialogDescription>
              Your progress will be saved, and you can continue later from where you left off.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsExitDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmExit}>
              <Save className="h-4 w-4 mr-2" />
              Save & Exit
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Results Dialog */}
      <Dialog open={isResultsDialogOpen} onOpenChange={setIsResultsDialogOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
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
                {getPrimaryStyle() && (
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/10">
                    <div className="text-primary">
                      {(() => {
                        const primaryStyle = getPrimaryStyle();
                        if (!primaryStyle) return null;
                        const PrimaryIcon = styleConfigs[primaryStyle].icon;
                        return <PrimaryIcon size={24} />;
                      })()}
                    </div>
                    <div>
                      <p className="font-medium">{getPrimaryStyle()} Learner</p>
                      <p className="text-sm text-muted-foreground">
                        {getDominantStyles()[0]?.[1]}% preference
                      </p>
                    </div>
                  </div>
                )}
                
                {getSecondaryStyle() && (
                  <>
                    <h3 className="text-lg font-medium mt-4 mb-2">Secondary Learning Style</h3>
                    <div className="flex items-center gap-3 p-4 rounded-lg bg-secondary/10">
                      <div className="text-secondary">
                        {(() => {
                          const secondaryStyle = getSecondaryStyle();
                          if (!secondaryStyle) return null;
                          const SecondaryIcon = styleConfigs[secondaryStyle].icon;
                          return <SecondaryIcon size={24} />;
                        })()}
                      </div>
                      <div>
                        <p className="font-medium">{getSecondaryStyle()} Learner</p>
                        <p className="text-sm text-muted-foreground">
                          {getDominantStyles()[1]?.[1]}% preference
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Recommendations</h3>
                {getPrimaryStyle() && (
                  <div className="space-y-1 mb-4">
                    {getRecommendations(getPrimaryStyle()!).slice(0, 3).map((rec, index) => (
                      <p key={index} className="text-sm flex items-start">
                        <span className="text-primary mr-2">•</span> {rec}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-3">Learning Style Breakdown</h3>
              <div className="space-y-3">
                {getDominantStyles().map(([style, percentage]) => {
                  const StyleIcon = styleConfigs[style].icon;
                  return (
                    <div key={style} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <StyleIcon className="h-5 w-5" />
                          <span>{style}</span>
                        </div>
                        <span>{percentage}%</span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={handleDownloadResults}
            >
              <Download className="h-4 w-4 mr-2" />
              Download Results
            </Button>
            <Button 
              className="flex-1" 
              onClick={() => {
                setIsResultsDialogOpen(false);
                navigate("/bonuses");
              }}
            >
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <NavigationBar />
    </div>
  );
};

export default LearningQuiz;
