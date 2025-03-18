
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

const Bonuses = () => {
  const navigate = useNavigate();
  const [showBrainMapping, setShowBrainMapping] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(false);

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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <PageHeader
        title="Learning Boosters"
        subtitle="Unlock powerful tools to enhance your study experience and maximize your potential"
        data-walkthrough="bonuses-header"
      />
      
      {/* Main content */}
      <div className="container mx-auto px-4 py-8 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Learning Style Quiz Card */}
          <div 
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
            data-walkthrough="learning-quiz"
          >
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center mr-3">
                  <Brain className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Learning Style Quiz</h3>
              </div>
              
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Discover your personal learning style and get study recommendations tailored to your cognitive preferences.
              </p>
              
              <div className="mt-auto">
                <Button
                  onClick={() => navigate('/learning-quiz')}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  Take Quiz
                </Button>
              </div>
            </div>
          </div>
          
          {/* Brain Mapping Visualization Card */}
          <div 
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
            data-walkthrough="brain-mapping"
          >
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center mr-3">
                  <Zap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Neural Pathway Mapping</h3>
              </div>
              
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Visualize how your learning and focus techniques are strengthening connections in your brain.
              </p>
              
              <div className="mt-auto">
                <Button
                  onClick={handleShowBrainMapping}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  View Brain Map
                </Button>
              </div>
            </div>
          </div>
          
          {/* Study Technique Guides Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center mr-3">
                  <BookOpen className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Study Technique Guides</h3>
              </div>
              
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Explore a variety of effective study techniques to optimize your learning sessions.
              </p>
              
              <div className="mt-auto">
                <Button
                  onClick={() => alert('Coming Soon!')}
                  className="bg-teal-600 hover:bg-teal-700 text-white"
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
              <AlertDialogTitle className="flex items-center gap-2 text-xl text-purple-600 dark:text-purple-400">
                <Sparkles className="h-5 w-5" /> 
                Neural Pathway Mapping - Coming Soon!
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-4 pt-2">
                <p>
                  We're developing an advanced visualization tool that maps your neural pathways as they strengthen through focused learning sessions.
                </p>
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-100 dark:border-purple-800/30">
                  <h4 className="font-medium flex items-center gap-2 text-purple-700 dark:text-purple-300">
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
              className="w-full mt-2 bg-purple-600 hover:bg-purple-700"
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
