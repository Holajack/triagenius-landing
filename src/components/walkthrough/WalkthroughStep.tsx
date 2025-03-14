
import { useEffect, useState, useRef } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useWalkthrough } from '@/contexts/WalkthroughContext';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { useIsMobile } from '@/hooks/use-mobile';

type HighlightOverlayProps = {
  targetRect: DOMRect | null;
};

// This creates a spotlight effect around the target element
const HighlightOverlay = ({ targetRect }: HighlightOverlayProps) => {
  if (!targetRect) return null;

  // Add padding around the element for better visibility
  const padding = 8;
  const highlightRect = {
    left: targetRect.left - padding,
    top: targetRect.top - padding,
    width: targetRect.width + (padding * 2),
    height: targetRect.height + (padding * 2),
    right: targetRect.right + padding,
    bottom: targetRect.bottom + padding,
  };

  return createPortal(
    <div className="fixed inset-0 z-40 pointer-events-none">
      {/* Semi-transparent overlay */}
      <div className="absolute inset-0 bg-black/60 transition-opacity duration-300" />
      
      {/* Cutout for the target element - transparent area */}
      <div 
        className="absolute bg-transparent"
        style={{
          left: highlightRect.left,
          top: highlightRect.top,
          width: highlightRect.width,
          height: highlightRect.height,
          boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)',
          borderRadius: '4px',
          // Remove pointer-events none to allow interaction with the highlighted element
          pointerEvents: 'none',
        }}
      />
      
      {/* Animated border around the target */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="absolute border-2 border-triage-purple rounded-md pointer-events-none"
        style={{
          left: highlightRect.left,
          top: highlightRect.top,
          width: highlightRect.width,
          height: highlightRect.height,
          boxShadow: '0 0 0 4px rgba(139, 92, 246, 0.3)',
        }}
      />
    </div>,
    document.body
  );
};

const WalkthroughStep = () => {
  const { state, dispatch } = useWalkthrough();
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const popoverTriggerRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();

  const currentStep = state.steps[state.currentStepIndex];
  
  useEffect(() => {
    if (!state.isActive || !currentStep?.targetSelector) return;
    
    const element = document.querySelector(currentStep.targetSelector) as HTMLElement;
    
    console.log("Current step:", currentStep);
    console.log("Target element found:", element ? "Yes" : "No");
    
    if (element) {
      setTargetElement(element);
      setTargetRect(element.getBoundingClientRect());
      
      // Add highlight effect to the element
      element.classList.add('ring-2', 'ring-triage-purple', 'ring-offset-2', 'transition-all');
      
      // Make the element interactive by removing pointer-events-none
      element.style.pointerEvents = 'auto';
      element.style.zIndex = '50';
      element.style.position = 'relative';
      
      // Scroll element into view with proper positioning based on device
      const elementRect = element.getBoundingClientRect();
      const isInViewport = 
        elementRect.top >= 0 &&
        elementRect.left >= 0 &&
        elementRect.bottom <= window.innerHeight &&
        elementRect.right <= window.innerWidth;
        
      if (!isInViewport) {
        const block = isMobile ? 'center' : 
          (currentStep.placement === 'top' ? 'end' : 
           currentStep.placement === 'bottom' ? 'start' : 'center');
        
        element.scrollIntoView({ 
          behavior: 'smooth', 
          block: block as ScrollLogicalPosition,
          inline: 'nearest'
        });
      }
      
      // Open popover after a short delay
      setTimeout(() => {
        setIsOpen(true);
      }, 400);
    } else {
      console.error("Element not found for selector:", currentStep.targetSelector);
      
      // If element is not found, try again after a short delay
      const retryTimer = setTimeout(() => {
        const retryElement = document.querySelector(currentStep.targetSelector) as HTMLElement;
        if (retryElement) {
          console.log("Element found on retry");
          // Re-trigger the current step effect by forcing a re-render
          setTargetElement(retryElement);
        } else {
          console.error("Element still not found after retry, moving to next step");
          // Skip to the next step if element is still not found
          dispatch({ type: 'NEXT_STEP' });
        }
      }, 1000);
      
      return () => clearTimeout(retryTimer);
    }
    
    // Update rect on window resize and scroll
    const handleUpdate = () => {
      if (element) {
        setTargetRect(element.getBoundingClientRect());
      }
    };
    
    window.addEventListener('resize', handleUpdate);
    window.addEventListener('scroll', handleUpdate);
    
    // Set up an interval to periodically update the rect
    // This helps when elements move due to animations or other dynamic changes
    const updateInterval = setInterval(handleUpdate, 100);
    
    return () => {
      window.removeEventListener('resize', handleUpdate);
      window.removeEventListener('scroll', handleUpdate);
      clearInterval(updateInterval);
      if (element) {
        element.classList.remove('ring-2', 'ring-triage-purple', 'ring-offset-2');
        element.style.pointerEvents = '';
        element.style.zIndex = '';
        element.style.position = '';
      }
    };
  }, [state.isActive, state.currentStepIndex, currentStep, isMobile, dispatch]);
  
  const handleNext = () => {
    dispatch({ type: 'NEXT_STEP' });
    setIsOpen(false);
    setTargetRect(null);
  };
  
  const handlePrevious = () => {
    dispatch({ type: 'PREVIOUS_STEP' });
    setIsOpen(false);
    setTargetRect(null);
  };
  
  const handleSkip = () => {
    dispatch({ type: 'COMPLETE_WALKTHROUGH' });
    setIsOpen(false);
    setTargetRect(null);
  };
  
  const isFirstStep = state.currentStepIndex === 0;
  const isLastStep = state.currentStepIndex === state.steps.length - 1;
  
  if (!state.isActive || !currentStep) return null;

  // Determine popover position with better mobile handling
  const getPopoverPosition = () => {
    if (!targetRect) return { top: 0, left: 0 };
    
    const padding = isMobile ? 16 : 10;
    
    // Base position at center of element
    let position = {
      top: targetRect.top + targetRect.height / 2,
      left: targetRect.left + targetRect.width / 2,
    };
    
    // Adjust based on placement
    switch (currentStep.placement) {
      case 'top':
        position.top = targetRect.top - padding;
        break;
      case 'bottom':
        position.top = targetRect.bottom + padding;
        break;
      case 'left':
        position.left = targetRect.left - padding;
        break;
      case 'right':
        position.left = targetRect.right + padding;
        break;
      default:
        // Default to bottom if not specified
        position.top = targetRect.bottom + padding;
    }
    
    return position;
  };
  
  // Determine optimal width based on screen size
  const getPopoverWidth = () => {
    if (isMobile) {
      // For very small screens, use almost full width
      if (window.innerWidth < 320) return 'calc(100vw - 40px)';
      // For small mobile screens
      if (window.innerWidth < 375) return '85vw';
      // For medium mobile screens
      if (window.innerWidth < 480) return '80vw';
      // For larger mobile screens
      return '75vw';
    }
    // Default width for tablets and desktops
    return '20rem';
  };
  
  return (
    <>
      <HighlightOverlay targetRect={targetRect} />
      
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger ref={popoverTriggerRef} asChild>
          <Button
            className="opacity-0 absolute pointer-events-none"
            style={getPopoverPosition()}
          >
            Trigger
          </Button>
        </PopoverTrigger>
        
        <PopoverContent 
          className="p-0 border-triage-purple shadow-lg z-50"
          style={{ width: getPopoverWidth() }}
          sideOffset={5}
          align={isMobile ? "center" : "start"}
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-3 rounded-t-md border-b border-triage-purple/20">
              <h3 className="font-semibold text-triage-purple">
                {currentStep.title}
              </h3>
            </div>
            
            <div className="p-4">
              <p className="text-sm text-gray-600 mb-4">
                {currentStep.description}
              </p>
              
              <div className="flex justify-between items-center">
                <div className="flex gap-1">
                  {state.steps.map((_, index) => (
                    <div
                      key={index}
                      className={`h-1.5 w-${isMobile ? '1.5' : '3'} rounded-full transition-colors ${
                        index <= state.currentStepIndex ? 'bg-triage-purple' : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
                
                <div className="flex items-center gap-2">
                  {!isFirstStep && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handlePrevious}
                      className={`h-8 ${isMobile ? 'px-1.5' : 'px-2'} text-xs`}
                    >
                      <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back
                    </Button>
                  )}
                  
                  {isLastStep ? (
                    <Button 
                      size="sm" 
                      onClick={handleNext}
                      className={`h-8 ${isMobile ? 'px-2' : 'px-3'} text-xs bg-triage-purple hover:bg-triage-purple/90`}
                    >
                      Finish
                    </Button>
                  ) : (
                    <Button 
                      size="sm" 
                      onClick={handleNext}
                      className={`h-8 ${isMobile ? 'px-2' : 'px-3'} text-xs bg-triage-purple hover:bg-triage-purple/90`}
                    >
                      Next <ArrowRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  )}
                </div>
              </div>
              
              <button
                onClick={handleSkip}
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        </PopoverContent>
      </Popover>
    </>
  );
};

export default WalkthroughStep;
