
import React, { useEffect } from 'react';
import { useWalkthrough, WalkthroughStep as WalkthroughStepType } from '@/contexts/WalkthroughContext';
import WalkthroughStepComponent from './WalkthroughStep';
import { Button } from '@/components/ui/button';
import { Info } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

type PageWalkthroughProps = {
  pageName: string;
  steps: WalkthroughStepType[];
  showHelpButton?: boolean;
};

const PageWalkthrough = ({ pageName, steps, showHelpButton = true }: PageWalkthroughProps) => {
  const { state, hasVisitedPage, markPageVisited, startWalkthrough } = useWalkthrough();
  const isMobile = useIsMobile();

  useEffect(() => {
    // Check if this is the first visit to this page
    if (!hasVisitedPage(pageName) && !state.isActive) {
      // Set timeout to allow page to fully render
      const timer = setTimeout(() => {
        startWalkthrough(steps);
        markPageVisited(pageName);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [pageName, steps, hasVisitedPage, markPageVisited, startWalkthrough, state.isActive]);

  return (
    <>
      <WalkthroughStepComponent />
      
      {/* Help button to restart the tutorial */}
      {showHelpButton && !state.isActive && (
        <Button
          variant="outline"
          size="icon"
          className="fixed bottom-20 right-4 rounded-full z-30 bg-white shadow-md border-triage-purple/20"
          onClick={() => startWalkthrough(steps)}
          data-walkthrough="help-button"
        >
          <Info className="h-5 w-5 text-triage-purple" />
        </Button>
      )}
    </>
  );
};

export default PageWalkthrough;
