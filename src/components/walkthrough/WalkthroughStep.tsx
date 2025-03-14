
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
  const [prevScrollY, setPrevScrollY] = useState(0);
  const [scrollLocked, setScrollLocked] = useState(false);

  const currentStep = state.steps[state.currentStepIndex];
  
  // Prevent scrolling during walkthrough
  useEffect(() => {
    if (state.isActive) {
      // Store current scroll position
      setPrevScrollY(window.scrollY);
      setScrollLocked(true);
      
      // Apply the scroll lock class to body
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.top = `-${prevScrollY}px`;
      
      return () => {
        // Remove scroll lock when component unmounts
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
        document.body.style.top = '';
        
        // Restore scroll position
        if (scrollLocked) {
          window.scrollTo(0, prevScrollY);
        }
        setScrollLocked(false);
      };
    }
  }, [state.isActive]);
  
  useEffect(() => {
    if (!state.isActive || !currentStep?.targetSelector) return;
    
    const element = document.querySelector(currentStep.targetSelector) as HTMLElement;
    
    if (element) {
      setTargetElement(element);
      setTargetRect(element.getBoundingClientRect());
      
      element.classList.add('ring-2', 'ring-triage-purple', 'ring-offset-2', 'transition-all');
      element.style.pointerEvents = 'auto';
      element.style.zIndex = '50';
      element.style.position = 'relative';
      
      const scrollToElement = () => {
        // First, unlock scrolling temporarily to allow programmatic scrolling
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
        document.body.style.top = '';
        
        const elementRect = element.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        
        // Calculate optimal scroll position
        let scrollPosition;
        
        // Calculate position that ensures the element is in optimal viewing position
        // and won't be covered by the popover
        const popoverHeight = 180; // Approximate height of the popover
        const buffer = isMobile ? 20 : 40;
        
        switch (currentStep.placement) {
          case 'top':
            // If placed on top, ensure element is in lower half of screen
            scrollPosition = window.scrollY + elementRect.top - (viewportHeight * 0.6);
            break;
          case 'bottom':
            // If placed on bottom, ensure element is in upper half of screen
            scrollPosition = window.scrollY + elementRect.top - (viewportHeight * 0.3);
            break;
          case 'left':
          case 'right':
            // For side placements, center the element vertically
            scrollPosition = window.scrollY + elementRect.top - (viewportHeight / 2) + (elementRect.height / 2);
            break;
          default:
            scrollPosition = window.scrollY + elementRect.top - (viewportHeight / 2);
        }
        
        // Apply scrolling
        window.scrollTo({
          top: Math.max(0, scrollPosition),
          behavior: 'smooth'
        });
        
        // After scrolling, update the rect position
        setTimeout(() => {
          setTargetRect(element.getBoundingClientRect());
          
          // Reapply scroll lock after a small delay
          setTimeout(() => {
            setPrevScrollY(window.scrollY);
            document.body.style.overflow = 'hidden';
            document.body.style.position = 'fixed';
            document.body.style.width = '100%';
            document.body.style.top = `-${window.scrollY}px`;
          }, 100);
        }, 400);
      };
      
      scrollToElement();
      
      setTimeout(() => {
        setIsOpen(true);
      }, 500);
      
      const handleUpdate = () => {
        if (element) {
          setTargetRect(element.getBoundingClientRect());
        }
      };
      
      window.addEventListener('resize', handleUpdate);
      
      // No need for scroll event listener as we're preventing scrolling
      
      return () => {
        window.removeEventListener('resize', handleUpdate);
        if (element) {
          element.classList.remove('ring-2', 'ring-triage-purple', 'ring-offset-2');
          element.style.pointerEvents = '';
          element.style.zIndex = '';
          element.style.position = '';
        }
      };
    }
  }, [state.isActive, state.currentStepIndex, currentStep, isMobile, dispatch, prevScrollY, scrollLocked]);
  
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
    // Restore normal scrolling before completing
    document.body.style.overflow = '';
    document.body.style.position = '';
    document.body.style.width = '';
    document.body.style.top = '';
    window.scrollTo(0, prevScrollY);
    setScrollLocked(false);
    
    dispatch({ type: 'COMPLETE_WALKTHROUGH' });
    setIsOpen(false);
    setTargetRect(null);
  };
  
  const isFirstStep = state.currentStepIndex === 0;
  const isLastStep = state.currentStepIndex === state.steps.length - 1;
  
  if (!state.isActive || !currentStep) return null;

  const getPopoverPosition = () => {
    if (!targetRect) return { top: 0, left: 0 };
    
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    
    let position = {
      top: targetRect.top + targetRect.height / 2,
      left: targetRect.left + targetRect.width / 2,
    };
    
    // Calculate popover placement to avoid covering the highlighted element
    const popoverHeight = 180; // Approximate height of the popover
    const popoverWidth = isMobile ? 280 : 360; // Approximate width
    const buffer = 20; // Space between element and popover
    
    switch (currentStep.placement) {
      case 'top':
        // Place above the element with enough distance
        position.top = targetRect.top - popoverHeight - buffer;
        position.left = targetRect.left + targetRect.width / 2;
        
        // If there's not enough space above, place it below
        if (position.top < 70) {
          position.top = targetRect.bottom + buffer;
        }
        break;
        
      case 'bottom':
        // Place below the element with enough distance
        position.top = targetRect.bottom + buffer;
        position.left = targetRect.left + targetRect.width / 2;
        
        // If there's not enough space below, place it above
        if (position.top + popoverHeight > viewportHeight - 20) {
          position.top = targetRect.top - popoverHeight - buffer;
        }
        break;
        
      case 'left':
        // Place to the left of the element
        position.top = targetRect.top + targetRect.height / 2 - popoverHeight / 2;
        position.left = targetRect.left - popoverWidth - buffer;
        
        // If there's not enough space to the left, place it to the right
        if (position.left < 20) {
          position.left = targetRect.right + buffer;
        }
        break;
        
      case 'right':
        // Place to the right of the element
        position.top = targetRect.top + targetRect.height / 2 - popoverHeight / 2;
        position.left = targetRect.right + buffer;
        
        // If there's not enough space to the right, place it to the left
        if (position.left + popoverWidth > viewportWidth - 20) {
          position.left = targetRect.left - popoverWidth - buffer;
        }
        break;
        
      default:
        // Default placement below the element
        position.top = targetRect.bottom + buffer;
        position.left = targetRect.left + targetRect.width / 2;
        
        if (position.top + popoverHeight > viewportHeight - 20) {
          position.top = targetRect.top - popoverHeight - buffer;
        }
    }
    
    // Ensure popover is within viewport bounds
    position.top = Math.max(70, Math.min(viewportHeight - 20 - popoverHeight, position.top));
    position.left = Math.max(20, Math.min(viewportWidth - 20 - popoverWidth/2, position.left));
    
    return position;
  };
  
  const getPopoverWidth = () => {
    if (isMobile) {
      if (window.innerWidth < 320) return 'calc(100vw - 40px)';
      if (window.innerWidth < 375) return 'calc(90vw - 20px)';
      if (window.innerWidth < 480) return 'calc(85vw - 16px)';
      return 'calc(80vw - 16px)';
    }
    if (window.innerWidth < 768) return '320px';
    return '360px';
  };
  
  const getPopoverAlign = () => {
    if (!targetRect) return "center";
    
    const viewportWidth = window.innerWidth;
    const elementCenterX = targetRect.left + (targetRect.width / 2);
    
    if (elementCenterX < viewportWidth / 3) return "start";
    if (elementCenterX > (viewportWidth * 2) / 3) return "end";
    return "center";
  };
  
  const getPopoverSide = () => {
    if (!targetRect) return "bottom";
    
    const viewportHeight = window.innerHeight;
    const elementCenterY = targetRect.top + (targetRect.height / 2);
    
    if (currentStep.placement === 'top') return "top";
    if (currentStep.placement === 'bottom') return "bottom";
    
    if (currentStep.placement === 'left') return "left";
    if (currentStep.placement === 'right') return "right";
    
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
