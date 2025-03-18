
import { useEffect } from 'react';
import { useWalkthrough } from '@/contexts/WalkthroughContext';
import { useLocation } from 'react-router-dom';
import WalkthroughStep from './WalkthroughStep';
import { Button } from '@/components/ui/button';
import { Info } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface PageWalkthroughProps {
  pagePath: string;
  steps: Array<{
    id: string;
    title: string;
    description: string;
    targetSelector: string;
    placement: 'top' | 'right' | 'bottom' | 'left';
  }>;
  showHelpButton?: boolean;
}

const PageWalkthrough = ({ pagePath, steps, showHelpButton = true }: PageWalkthroughProps) => {
  const { state, dispatch, shouldShowWalkthrough } = useWalkthrough();
  const location = useLocation();
  const isMobile = useIsMobile();

  useEffect(() => {
    // Only start walkthrough if this page hasn't been visited yet
    if (shouldShowWalkthrough(pagePath)) {
      // Delay to ensure all elements are rendered
      const timer = setTimeout(() => {
        startWalkthrough();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [pagePath, shouldShowWalkthrough]);

  const startWalkthrough = () => {
    // Adjust placements for mobile if needed
    const adjustedSteps = steps.map(step => {
      let optimizedPlacement = step.placement;
      
      // Adjust placement for mobile devices
      if (isMobile) {
        // For most mobile cases, top or bottom works better than left/right
        if (optimizedPlacement === 'left' || optimizedPlacement === 'right') {
          optimizedPlacement = 'bottom';
        }
      }
      
      return {
        ...step,
        placement: optimizedPlacement as 'top' | 'right' | 'bottom' | 'left'
      };
    });
    
    dispatch({ 
      type: 'START_WALKTHROUGH', 
      payload: adjustedSteps,
      pagePath 
    });
  };

  return (
    <>
      <WalkthroughStep />
      
      {/* Help button to restart the tutorial */}
      {!state.isActive && showHelpButton && (
        <Button
          variant="outline"
          size="icon"
          className="fixed bottom-20 right-4 rounded-full z-30 bg-white shadow-md border-triage-purple/20"
          onClick={startWalkthrough}
          data-walkthrough="help-button"
        >
          <Info className="h-5 w-5 text-triage-purple" />
        </Button>
      )}
    </>
  );
};

export default PageWalkthrough;
