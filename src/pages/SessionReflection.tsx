
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, BookText, CheckCheck, RotateCcw, MessageCircle } from "lucide-react";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { cn } from "@/lib/utils";
import { useTheme } from "@/contexts/ThemeContext";
import PageHeader from "@/components/common/PageHeader";
import { toast } from "sonner";

const SessionReflection = () => {
  const { state } = useOnboarding();
  const { theme } = useTheme();
  const navigate = useNavigate();
  
  const [accomplished, setAccomplished] = useState("");
  const [learned, setLearned] = useState("");
  const [revisit, setRevisit] = useState("");
  
  const handleSubmit = () => {
    // Save reflection data to localStorage for potential future use
    const reflectionData = {
      accomplished,
      learned,
      revisit,
      timestamp: new Date().toISOString()
    };
    
    localStorage.setItem("sessionReflection", JSON.stringify(reflectionData));
    toast.success("Reflection saved successfully!");
    
    // Navigate to the break timer page
    navigate("/break-timer");
  };
  
  return (
    <div className={cn(
      "min-h-screen bg-background text-foreground flex flex-col items-center p-4",
      `theme-${state.environment || 'default'} ${theme}`
    )}>
      <div className="w-full max-w-3xl space-y-6">
        <PageHeader title="Session Reflection" subtitle="Take a moment to reflect on your focus session" />
        
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageCircle className="mr-2 h-5 w-5 text-primary" />
              Why Reflect?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Taking a moment to reflect on your focus session helps solidify your learning and identify areas for improvement.
              Research shows that reflection is a key component of effective learning and memory retention.
            </p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <CheckCheck className="mr-2 h-5 w-5 text-primary" />
                What did you accomplish?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="List the tasks or goals you completed during this session..."
                className="min-h-[100px]"
                value={accomplished}
                onChange={(e) => setAccomplished(e.target.value)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <BookText className="mr-2 h-5 w-5 text-primary" />
                What did you learn?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="What new concepts, insights, or skills did you gain?"
                className="min-h-[100px]"
                value={learned}
                onChange={(e) => setLearned(e.target.value)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <RotateCcw className="mr-2 h-5 w-5 text-primary" />
                Topics to revisit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Are there any subtopics or concepts you want to revisit in your next session?"
                className="min-h-[100px]"
                value={revisit}
                onChange={(e) => setRevisit(e.target.value)}
              />
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end mt-6">
          <Button onClick={handleSubmit} size="lg">
            Submit Reflection & Take a Break
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SessionReflection;
