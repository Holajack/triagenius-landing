import { useState } from 'react';
import PageHeader from '@/components/common/PageHeader';
import LearningStyleQuiz from '@/components/bonuses/LearningStyleQuiz';
import TerrainVisualization from '@/components/reports/terrain/TerrainVisualization';
import NavigationBar from '@/components/dashboard/NavigationBar';
import BonusesWalkthrough from '@/components/walkthrough/BonusesWalkthrough';

const Bonuses = () => {
  const [isQuizCompleted, setIsQuizCompleted] = useState(false);

  const handleQuizComplete = () => {
    setIsQuizCompleted(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div data-walkthrough="bonuses-header">
        <PageHeader title="Bonus Features" subtitle="Explore additional tools to enhance your learning" />
      </div>
      
      <div className="container mx-auto px-4 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div data-walkthrough="learning-style-quiz">
            <LearningStyleQuiz onQuizComplete={handleQuizComplete} />
          </div>
          <div data-walkthrough="brain-mapping">
            <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium">Brain Mapping</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Visualize your cognitive patterns and learning pathways
                </p>
              </div>
              <div className="h-80">
                <TerrainVisualization />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div data-walkthrough="navigation-bar">
        <NavigationBar />
      </div>
      
      <BonusesWalkthrough />
    </div>
  );
};

export default Bonuses;
