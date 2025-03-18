
import React from 'react';

interface LeaderboardSkeletonListProps {
  count: number;
}

const LeaderboardSkeletonList = ({ count }: LeaderboardSkeletonListProps) => {
  return (
    <div className="animate-pulse space-y-4">
      {[...Array(count)].map((_, index) => (
        <div 
          key={index}
          className="flex items-center gap-3 p-3 rounded-md border"
        >
          <div className="w-8 h-8 flex items-center justify-center">
            <div className="h-4 w-4 rounded-full bg-muted"></div>
          </div>
          
          <div className="h-8 w-8 rounded-full bg-muted"></div>
          
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-center mb-1">
              <div className="h-4 bg-muted rounded w-24"></div>
              <div className="flex items-center gap-2">
                <div className="h-3 bg-muted rounded w-10"></div>
                <div className="h-3 bg-muted rounded w-12"></div>
              </div>
            </div>
            <div className="h-1.5 bg-muted rounded w-full"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default LeaderboardSkeletonList;
