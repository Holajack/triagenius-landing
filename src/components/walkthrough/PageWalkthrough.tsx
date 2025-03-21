
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

  // Pre-enhance walkthrough target elements
  useEffect(() => {
    // Add data attributes to all walkthrough targets
    steps.forEach(step => {
      const element = document.querySelector(step.targetSelector);
      if (element) {
        element.setAttribute('data-walkthrough-target', step.id);
        
        // Ensure the element has relative positioning and appropriate z-index when hovered
        const enhanceElement = (el: Element) => {
          if (el instanceof HTMLElement) {
            el.addEventListener('mouseenter', () => {
              if (!state.isActive) {
                el.style.position = 'relative';
                el.style.zIndex = '5';
              }
            });
            
            el.addEventListener('mouseleave', () => {
              if (!state.isActive) {
                el.style.position = '';
                el.style.zIndex = '';
              }
            });
          }
        };
        
        enhanceElement(element);
      }
    });
    
    return () => {
      // Clean up data attributes
      steps.forEach(step => {
        const element = document.querySelector(step.targetSelector);
        if (element) {
          element.removeAttribute('data-walkthrough-target');
          
          if (element instanceof HTMLElement) {
            element.style.position = '';
            element.style.zIndex = '';
          }
        }
      });
    };
  }, [steps, state.isActive]);

  return (
    <>
      <WalkthroughStepComponent />
      
      {/* Help button to restart the tutorial */}
      {showHelpButton && !state.isActive && (
        <Button
          variant="outline"
          size="icon"
          className="fixed bottom-20 right-4 rounded-full z-30 bg-white shadow-md border-triage-purple/20 hover:bg-triage-purple/10 hover:border-triage-purple transition-all duration-300"
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
