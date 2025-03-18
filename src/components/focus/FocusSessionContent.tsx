import React from 'react';
import FocusTimer from '@/components/focus/FocusTimer';
import SessionGoals from '@/components/focus/SessionGoals';

const FocusSessionContent = ({ sessionData, onEndSession }) => {
  const handleEndSession = () => {
    onEndSession();
  };

  return (
    <div className="flex-grow flex flex-col md:flex-row px-4 py-6 gap-6">
      <div className="w-full md:w-2/3 flex flex-col space-y-6">
        <div 
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 flex-grow flex flex-col justify-center items-center"
          data-walkthrough="focus-timer"
        >
          <FocusTimer 
            initialTime={sessionData?.duration || 25 * 60} 
            onSessionEnd={onEndSession}
          />
        </div>
        <div className="text-center">
          <button
            onClick={handleEndSession}
            className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors shadow-sm"
            data-walkthrough="end-session"
          >
            End Session
          </button>
        </div>
      </div>
      <div 
        className="w-full md:w-1/3"
        data-walkthrough="session-goals"
      >
        <SessionGoals 
          goals={sessionData?.goals || []}
        />
      </div>
    </div>
  );
};

export default FocusSessionContent;
