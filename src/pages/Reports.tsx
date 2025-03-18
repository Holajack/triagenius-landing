import { useState } from 'react';
import PageHeader from '@/components/common/PageHeader';
import SessionReportsList from '@/components/reports/SessionReportsList';
import FocusBreakdown from '@/components/reports/FocusBreakdown';
import CognitiveMetrics from '@/components/reports/CognitiveMetrics';
import NavigationBar from '@/components/dashboard/NavigationBar';
import ReportsWalkthrough from '@/components/walkthrough/ReportsWalkthrough';

const Reports = () => {
  const [selectedSession, setSelectedSession] = useState(null);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div data-walkthrough="reports-header">
        <PageHeader 
          title="Reports & Analytics" 
          subtitle="Track your progress and review your focus sessions" 
        />
      </div>
      
      <div className="container mx-auto px-4 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div data-walkthrough="session-list">
              <SessionReportsList />
            </div>
          </div>
          <div className="lg:col-span-2 space-y-6">
            <div data-walkthrough="focus-breakdown">
              <FocusBreakdown />
            </div>
            <div data-walkthrough="cognitive-metrics">
              <CognitiveMetrics />
            </div>
          </div>
        </div>
      </div>
      
      <div data-walkthrough="navigation-bar">
        <NavigationBar />
      </div>
      
      <ReportsWalkthrough />
    </div>
  );
};

export default Reports;
