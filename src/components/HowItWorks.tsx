
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Brain, Target, ChevronRight, Clock, Award, BarChart4 } from "lucide-react";

const HowItWorks = () => {
  const [open, setOpen] = useState(false);
  
  // Check if we're on the landing page (index route)
  const isLandingPage = window.location.pathname === '/';
  
  const features = [
    {
      icon: <Target className="w-6 h-6 text-triage-purple" />,
      title: "Set Your Focus",
      description: "Choose a task, set a timer, and commit to distraction-free work."
    },
    {
      icon: <Clock className="w-6 h-6 text-triage-purple" />,
      title: "Timed Sessions",
      description: "Work in optimized intervals for maximum productivity and focus."
    },
    {
      icon: <BarChart4 className="w-6 h-6 text-triage-purple" />,
      title: "Track Progress",
      description: "Visualize your focus habits and see your productivity improve over time."
    },
    {
      icon: <Award className="w-6 h-6 text-triage-purple" />,
      title: "Level Up",
      description: "Earn rewards and level up as you build consistent focus habits."
    },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          className={`flex items-center justify-center ${isLandingPage ? 'text-triage-forestGreen hover:text-triage-forestGreen' : 'text-gray-600 hover:text-gray-900'} bg-transparent hover:bg-gray-100/50 rounded-xl px-4 py-2 transition-all duration-300`}
        >
          <span className="mr-1 text-sm font-medium">How It Works</span>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="glass rounded-2xl border-0 shadow-lg max-w-md mx-auto overflow-hidden">
        <DialogHeader className="mb-2">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 mx-auto mb-3">
            <Brain className="w-6 h-6 text-triage-purple" />
          </div>
          <DialogTitle className="text-center text-2xl">How The Triage System Works</DialogTitle>
          <DialogDescription className="text-center text-gray-600">
            Master your focus with these simple steps
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-5 mt-4 mb-2 px-1">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="flex items-start gap-4 p-3 rounded-xl hover:bg-white/80 transition-colors duration-300"
              style={{animationDelay: `${index * 0.1}s`}}
            >
              <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-purple-50">
                {feature.icon}
              </div>
              <div>
                <h3 className="font-medium text-gray-900">{feature.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HowItWorks;
