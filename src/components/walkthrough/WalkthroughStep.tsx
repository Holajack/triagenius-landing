
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

const HighlightOverlay = ({ targetRect }: HighlightOverlayProps) => {
  if (!targetRect) return null;

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
      <div className="absolute inset-0 bg-black/60 transition-opacity duration-300" />
      <div 
        className="absolute bg-transparent"
        style={{
          left: highlightRect.left,
          top: highlightRect.top,
          width: highlightRect.width,
          height: highlightRect.height,
          boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)',
          borderRadius: '4px',
          pointerEvents: 'none',
        }}
      />
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
      
      element.classList.add('ring-2', 'ring-triage-purple', 'ring-offset-2', 'transition-all');
      element.style.pointerEvents = 'auto';
      element.style.zIndex = '50';
      element.style.position = 'relative';
      
      const scrollToElement = () => {
        const elementRect = element.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const isInViewport = 
          elementRect.top >= 0 &&
          elementRect.bottom <= viewportHeight;
        
        if (!isInViewport) {
          const isNearTop = elementRect.top < viewportHeight * 0.2;
          const isNearBottom = elementRect.bottom > viewportHeight * 0.8;
          
          let block: ScrollLogicalPosition = 'center';
          
          if (isNearTop) {
            block = 'start';
          } else if (isNearBottom) {
            block = 'end';
          }
          
          if (isMobile) {
            if (currentStep.placement === 'top') {
              block = 'end';
            } else if (currentStep.placement === 'bottom') {
              block = 'start';
            } else {
              block = 'center';
            }
          }
          
          setTimeout(() => {
            element.scrollIntoView({
              behavior: 'smooth',
              block,
              inline: 'nearest'
            });
          }, 100);
        }
      };
      
      scrollToElement();
      
      setTimeout(() => {
        setIsOpen(true);
      }, 500);
    } else {
      console.error("Element not found for selector:", currentStep.targetSelector);
      
      const retryTimer = setTimeout(() => {
        const retryElement = document.querySelector(currentStep.targetSelector) as HTMLElement;
        if (retryElement) {
          console.log("Element found on retry");
          setTargetElement(retryElement);
        } else {
          console.error("Element still not found after retry, moving to next step");
          dispatch({ type: 'NEXT_STEP' });
        }
      }, 1000);
      
      return () => clearTimeout(retryTimer);
    }
    
    const handleUpdate = () => {
      if (element) {
        setTargetRect(element.getBoundingClientRect());
      }
    };
    
    window.addEventListener('resize', handleUpdate);
    window.addEventListener('scroll', handleUpdate);
    
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

  // Improved popover position calculation based on the element's position and placement
  const getPopoverPosition = () => {
    if (!targetRect) return { top: 0, left: 0 };
    
    const padding = isMobile ? 20 : 12;
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    
    // Base position in the center of the target
    let position = {
      top: targetRect.top + targetRect.height / 2,
      left: targetRect.left + targetRect.width / 2,
    };
    
    // Adjust position based on placement
    switch (currentStep.placement) {
      case 'top':
        position.top = targetRect.top - padding;
        position.left = targetRect.left + targetRect.width / 2;
        
        // Ensure it doesn't go off the top of the screen
        if (position.top < padding) {
          position.top = targetRect.bottom + padding; // Flip to bottom if not enough space
        }
        break;
        
      case 'bottom':
        position.top = targetRect.bottom + padding;
        position.left = targetRect.left + targetRect.width / 2;
        
        // Ensure it doesn't go off the bottom of the screen
        if (position.top > viewportHeight - 200) { // 200px is an estimate of popover height
          position.top = Math.max(padding, targetRect.top - padding - 150); // Flip to top
        }
        break;
        
      case 'left':
        position.top = targetRect.top + targetRect.height / 2;
        position.left = targetRect.left - padding;
        
        // Ensure it doesn't go off the left of the screen
        if (position.left < 150) { // 150px is an estimate of half the popover width
          position.left = targetRect.right + padding; // Flip to right
        }
        break;
        
      case 'right':
        position.top = targetRect.top + targetRect.height / 2;
        position.left = targetRect.right + padding;
        
        // Ensure it doesn't go off the right of the screen
        if (position.left > viewportWidth - 150) { // 150px is an estimate of half the popover width
          position.left = Math.max(padding, targetRect.left - padding); // Flip to left
        }
        break;
        
      default:
        // Default to bottom placement with optimized positioning
        position.top = targetRect.bottom + padding;
        position.left = targetRect.left + targetRect.width / 2;
        
        // Ensure it's visible
        if (position.top > viewportHeight - 100) {
          position.top = Math.max(padding, targetRect.top - padding - 100);
        }
    }
    
    // Final boundary checks
    position.top = Math.max(padding, Math.min(viewportHeight - padding, position.top));
    position.left = Math.max(padding, Math.min(viewportWidth - padding, position.left));
    
    return position;
  };
  
  const getPopoverWidth = () => {
    if (isMobile) {
      if (window.innerWidth < 320) return 'calc(100vw - 32px)';
      if (window.innerWidth < 375) return 'calc(90vw - 20px)';
      if (window.innerWidth < 480) return 'calc(85vw - 16px)';
      return 'calc(80vw - 16px)';
    }
    if (window.innerWidth < 768) return '320px';
    return '360px';
  };
  
  // Calculate the optimal align and side for the popover based on the element position
  const getPopoverAlign = () => {
    if (!targetRect) return "center";
    
    const viewportWidth = window.innerWidth;
    const elementCenterX = targetRect.left + (targetRect.width / 2);
    
    // Calculate which third of the screen the element is in
    if (elementCenterX < viewportWidth / 3) return "start";
    if (elementCenterX > (viewportWidth * 2) / 3) return "end";
    return "center";
  };
  
  // Calculate the optimal side for the popover
  const getPopoverSide = () => {
    if (!targetRect) return "bottom";
    
    const viewportHeight = window.innerHeight;
    const elementCenterY = targetRect.top + (targetRect.height / 2);
    
    // For top/bottom placement
    if (currentStep.placement === 'top') return "top";
    if (currentStep.placement === 'bottom') return "bottom";
    
    // For left/right placement
    if (currentStep.placement === 'left') return "left";
    if (currentStep.placement === 'right') return "right";
    
    // Default logic based on position in viewport
    if (elementCenterY < viewportHeight / 2) return "bottom";
    return "top";
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
          align={getPopoverAlign() as "start" | "center" | "end"}
          side={getPopoverSide() as "top" | "right" | "bottom" | "left"}
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
