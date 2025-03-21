
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, Zap, BookOpen, Sparkles, CalendarClock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import PageHeader from '@/components/common/PageHeader';
import NavigationBar from '@/components/dashboard/NavigationBar';
import LearningStyleQuiz from '@/components/bonuses/LearningStyleQuiz';
import TerrainVisualization from '@/components/reports/terrain/TerrainVisualization';
import BonusesWalkthrough from '@/components/walkthrough/BonusesWalkthrough';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { cn } from '@/lib/utils';

const Bonuses = () => {
  const navigate = useNavigate();
  const [showBrainMapping, setShowBrainMapping] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(false);
  const { state } = useOnboarding();

  const handleShowBrainMapping = () => {
    // Instead of showing the brain mapping visualization, show the coming soon dialog
    setShowComingSoon(true);
  };

  const handleCloseBrainMapping = () => {
    setShowBrainMapping(false);
  };

  const handleCloseComingSoon = () => {
    setShowComingSoon(false);
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

  // Get environment-specific icon background class
  const getEnvIconBgClass = (defaultClass: string) => {
    if (!state || !state.environment) return defaultClass;
    
    switch (state.environment) {
      case 'office': return "bg-blue-100 dark:bg-blue-900/40";
      case 'park': return "bg-green-100 dark:bg-green-900/40";
      case 'home': return "bg-orange-100 dark:bg-orange-900/40";
      case 'coffee-shop': return "bg-amber-100 dark:bg-amber-900/40";
      case 'library': return "bg-gray-100 dark:bg-gray-800/40";
      default: return defaultClass;
    }
  };

  // Get environment-specific icon color class
  const getEnvIconColorClass = (defaultClass: string) => {
    if (!state || !state.environment) return defaultClass;
    
    switch (state.environment) {
      case 'office': return "text-blue-600 dark:text-blue-400";
      case 'park': return "text-green-600 dark:text-green-400";
      case 'home': return "text-orange-600 dark:text-orange-400";
      case 'coffee-shop': return "text-amber-600 dark:text-amber-400";
      case 'library': return "text-gray-600 dark:text-gray-400";
      default: return defaultClass;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <PageHeader
        title="Bonus Features"
        subtitle="Explore additional tools and resources"
        data-walkthrough="bonuses-header"
      />
      
      {/* Main content */}
      <div className="container mx-auto px-4 py-8 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Learning Style Quiz Card */}
          <div 
            className={cn(
              "rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-200",
              state.environment === 'office' ? "bg-gradient-to-br from-blue-50/70 to-white dark:from-blue-900/10 dark:to-gray-800" :
              state.environment === 'park' ? "bg-gradient-to-br from-green-50/70 to-white dark:from-green-900/10 dark:to-gray-800" :
              state.environment === 'home' ? "bg-gradient-to-br from-orange-50/70 to-white dark:from-orange-900/10 dark:to-gray-800" :
              state.environment === 'coffee-shop' ? "bg-gradient-to-br from-amber-50/70 to-white dark:from-amber-900/10 dark:to-gray-800" :
              state.environment === 'library' ? "bg-gradient-to-br from-gray-50/70 to-white dark:from-gray-900/10 dark:to-gray-800" :
              "bg-gradient-to-br from-indigo-50/70 to-white dark:from-indigo-900/10 dark:to-gray-800"
            )}
            data-walkthrough="learning-quiz"
          >
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center mr-3", 
                  getEnvIconBgClass("bg-indigo-100 dark:bg-indigo-900/40")
                )}>
                  <Brain className={cn("w-5 h-5", 
                    getEnvIconColorClass("text-indigo-600 dark:text-indigo-400")
                  )} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Learning Style Quiz</h3>
              </div>
              
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Discover your personal learning style and get study recommendations tailored to your cognitive preferences.
              </p>
              
              <div className="mt-auto">
                <Button
                  onClick={() => navigate('/learning-quiz')}
                  className={cn("text-white", getEnvButtonClass())}
                >
                  Take Quiz
                </Button>
              </div>
            </div>
          </div>
          
          {/* Brain Mapping Visualization Card */}
          <div 
            className={cn(
              "rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-200",
              state.environment === 'office' ? "bg-gradient-to-br from-blue-50/70 to-white dark:from-blue-900/10 dark:to-gray-800" :
              state.environment === 'park' ? "bg-gradient-to-br from-green-50/70 to-white dark:from-green-900/10 dark:to-gray-800" :
              state.environment === 'home' ? "bg-gradient-to-br from-orange-50/70 to-white dark:from-orange-900/10 dark:to-gray-800" :
              state.environment === 'coffee-shop' ? "bg-gradient-to-br from-amber-50/70 to-white dark:from-amber-900/10 dark:to-gray-800" :
              state.environment === 'library' ? "bg-gradient-to-br from-gray-50/70 to-white dark:from-gray-900/10 dark:to-gray-800" :
              "bg-gradient-to-br from-purple-50/70 to-white dark:from-purple-900/10 dark:to-gray-800"
            )}
            data-walkthrough="brain-mapping"
          >
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center mr-3", 
                  getEnvIconBgClass("bg-purple-100 dark:bg-purple-900/40")
                )}>
                  <Zap className={cn("w-5 h-5", 
                    getEnvIconColorClass("text-purple-600 dark:text-purple-400")
                  )} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Neural Pathway Mapping</h3>
              </div>
              
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Visualize how your learning and focus techniques are strengthening connections in your brain.
              </p>
              
              <div className="mt-auto">
                <Button
                  onClick={handleShowBrainMapping}
                  className={cn("text-white", getEnvButtonClass())}
                >
                  View Brain Map
                </Button>
              </div>
            </div>
          </div>
          
          {/* Study Technique Guides Card */}
          <div 
            className={cn(
              "rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-200",
              state.environment === 'office' ? "bg-gradient-to-br from-blue-50/70 to-white dark:from-blue-900/10 dark:to-gray-800" :
              state.environment === 'park' ? "bg-gradient-to-br from-green-50/70 to-white dark:from-green-900/10 dark:to-gray-800" :
              state.environment === 'home' ? "bg-gradient-to-br from-orange-50/70 to-white dark:from-orange-900/10 dark:to-gray-800" :
              state.environment === 'coffee-shop' ? "bg-gradient-to-br from-amber-50/70 to-white dark:from-amber-900/10 dark:to-gray-800" :
              state.environment === 'library' ? "bg-gradient-to-br from-gray-50/70 to-white dark:from-gray-900/10 dark:to-gray-800" :
              "bg-gradient-to-br from-teal-50/70 to-white dark:from-teal-900/10 dark:to-gray-800"
            )}
          >
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center mr-3", 
                  getEnvIconBgClass("bg-teal-100 dark:bg-teal-900/40")
                )}>
                  <BookOpen className={cn("w-5 h-5", 
                    getEnvIconColorClass("text-teal-600 dark:text-teal-400")
                  )} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Study Technique Guides</h3>
              </div>
              
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Explore a variety of effective study techniques to optimize your learning sessions.
              </p>
              
              <div className="mt-auto">
                <Button
                  onClick={() => navigate('/learning-toolkit')}
                  className={cn("text-white", getEnvButtonClass())}
                >
                  Explore Guides
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Brain Mapping Dialog */}
        <Dialog open={showBrainMapping} onOpenChange={setShowBrainMapping}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <TerrainVisualization />
            <Button onClick={handleCloseBrainMapping} className="mt-4">Close</Button>
          </DialogContent>
        </Dialog>

        {/* Coming Soon Dialog */}
        <AlertDialog open={showComingSoon} onOpenChange={setShowComingSoon}>
          <AlertDialogContent className="max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle className={cn(
                "flex items-center gap-2 text-xl", 
                state.environment === 'office' ? "text-blue-600 dark:text-blue-400" :
                state.environment === 'park' ? "text-green-600 dark:text-green-400" :
                state.environment === 'home' ? "text-orange-600 dark:text-orange-400" :
                state.environment === 'coffee-shop' ? "text-amber-600 dark:text-amber-400" :
                state.environment === 'library' ? "text-gray-600 dark:text-gray-400" :
                "text-purple-600 dark:text-purple-400"
              )}>
                <Sparkles className="h-5 w-5" /> 
                Neural Pathway Mapping - Coming Soon!
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-4 pt-2">
                <p>
                  We're developing an advanced visualization tool that maps your neural pathways as they strengthen through focused learning sessions.
                </p>
                <div className={cn(
                  "p-4 rounded-lg border",
                  state.environment === 'office' ? "bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800/30" :
                  state.environment === 'park' ? "bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800/30" :
                  state.environment === 'home' ? "bg-orange-50 dark:bg-orange-900/20 border-orange-100 dark:border-orange-800/30" :
                  state.environment === 'coffee-shop' ? "bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800/30" :
                  state.environment === 'library' ? "bg-gray-50 dark:bg-gray-900/20 border-gray-100 dark:border-gray-800/30" :
                  "bg-purple-50 dark:bg-purple-900/20 border-purple-100 dark:border-purple-800/30"
                )}>
                  <h4 className={cn(
                    "font-medium flex items-center gap-2",
                    state.environment === 'office' ? "text-blue-700 dark:text-blue-300" :
                    state.environment === 'park' ? "text-green-700 dark:text-green-300" :
                    state.environment === 'home' ? "text-orange-700 dark:text-orange-300" :
                    state.environment === 'coffee-shop' ? "text-amber-700 dark:text-amber-300" :
                    state.environment === 'library' ? "text-gray-700 dark:text-gray-300" :
                    "text-purple-700 dark:text-purple-300"
                  )}>
                    <CalendarClock className="h-4 w-4" /> 
                    Planned Features:
                  </h4>
                  <ul className="mt-2 space-y-1 text-sm">
                    <li>• 3D visualization of your cognitive patterns</li>
                    <li>• Real-time brain activity insights</li>
                    <li>• Personalized recommendations based on neural activity</li>
                    <li>• Track your cognitive growth over time</li>
                  </ul>
                </div>
                <p className="text-sm text-muted-foreground italic">
                  Be among the first to experience this groundbreaking feature when it launches!
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <Button 
              onClick={handleCloseComingSoon} 
              className={cn(
                "w-full mt-2 text-white",
                state.environment === 'office' ? "bg-blue-600 hover:bg-blue-700" :
                state.environment === 'park' ? "bg-green-600 hover:bg-green-700" :
                state.environment === 'home' ? "bg-orange-500 hover:bg-orange-600" :
                state.environment === 'coffee-shop' ? "bg-amber-500 hover:bg-amber-600" :
                state.environment === 'library' ? "bg-gray-600 hover:bg-gray-700" :
                "bg-purple-600 hover:bg-purple-700"
              )}
            >
              I can't wait!
            </Button>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      
      {/* Add navigation bar with data-walkthrough attribute */}
      <div data-walkthrough="navigation-bar">
        <NavigationBar />
      </div>
      
      {/* Add the bonuses walkthrough component */}
      <BonusesWalkthrough />
    </div>
  );
};

export default Bonuses;
