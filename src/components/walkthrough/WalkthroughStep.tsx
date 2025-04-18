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

  return createPortal(
    <div className="fixed inset-0 z-40 pointer-events-none">
      <div className="absolute inset-0 bg-black/60 transition-opacity duration-300" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="absolute border-2 border-triage-purple rounded-md pointer-events-none"
        style={{
          left: targetRect.left,
          top: targetRect.top,
          width: targetRect.width,
          height: targetRect.height,
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
      
      element.classList.add('walkthrough-highlight');
      element.style.position = 'relative';
      element.style.zIndex = '50';
      
      const scrollToElement = () => {
        const elementRect = element.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        
        const isInViewport = 
          elementRect.top >= 80 &&
          elementRect.bottom <= viewportHeight - 150;
        
        if (!isInViewport) {
          let scrollPosition;
          const buffer = isMobile ? 100 : 150;
          
          if (elementRect.height > viewportHeight / 2) {
            scrollPosition = window.scrollY + elementRect.top - 100;
          } else {
            switch (currentStep.placement) {
              case 'top':
                scrollPosition = window.scrollY + elementRect.top - (viewportHeight / 3);
                break;
              case 'bottom':
                scrollPosition = window.scrollY + elementRect.top - (viewportHeight / 3);
                break;
              case 'left':
              case 'right':
                scrollPosition = window.scrollY + elementRect.top - (viewportHeight / 2) + (elementRect.height / 2);
                break;
              default:
                scrollPosition = window.scrollY + elementRect.top - (viewportHeight / 2) + (elementRect.height / 2);
            }
          }
          
          scrollPosition = Math.max(0, scrollPosition);
          
          window.scrollTo({
            top: scrollPosition,
            behavior: 'smooth'
          });
        }
      };
      
      scrollToElement();
      
      setTimeout(() => {
        setIsOpen(true);
        setTimeout(scrollToElement, 100);
      }, 400);
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
    
    const pulseAnimation = () => {
      if (!element) return;
      element.animate([
        { boxShadow: '0 0 0 2px rgba(139, 92, 246, 0.4)' },
        { boxShadow: '0 0 0 4px rgba(139, 92, 246, 0.6)' },
        { boxShadow: '0 0 0 2px rgba(139, 92, 246, 0.4)' }
      ], {
        duration: 2000,
        iterations: Infinity
      });
    };
    
    const pulseTimer = setTimeout(pulseAnimation, 500);
    
    return () => {
      window.removeEventListener('resize', handleUpdate);
      window.removeEventListener('scroll', handleUpdate);
      clearInterval(updateInterval);
      clearTimeout(pulseTimer);
      
      if (element) {
        element.classList.remove('walkthrough-highlight');
        element.style.position = '';
        element.style.zIndex = '';
        element.getAnimations().forEach(anim => anim.cancel());
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
    dispatch({ type: 'END_WALKTHROUGH' });
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
    
    const visibleTop = window.scrollY;
    const visibleBottom = window.scrollY + viewportHeight;
    
    let position = {
      top: targetRect.top + targetRect.height / 2,
      left: targetRect.left + targetRect.width / 2,
    };
    
    const mobileTopOffset = isMobile ? 10 : 0;
    const mobileLeftOffset = isMobile ? 0 : 0;
    
    switch (currentStep.placement) {
      case 'top':
        position.top = targetRect.top - 10 - mobileTopOffset;
        position.left = targetRect.left + targetRect.width / 2 + mobileLeftOffset;
        
        if (position.top < visibleTop + 70) {
          position.top = targetRect.bottom + 10;
        }
        break;
        
      case 'bottom':
        position.top = targetRect.bottom + 10;
        position.left = targetRect.left + targetRect.width / 2 + mobileLeftOffset;
        
        if (position.top > visibleBottom - 150) {
          position.top = targetRect.top - 10 - mobileTopOffset;
        }
        break;
        
      case 'left':
        position.top = targetRect.top + targetRect.height / 2;
        position.left = targetRect.left - 10;
        
        if (position.left < 150) {
          position.left = targetRect.right + 10;
        }
        break;
        
      case 'right':
        position.top = targetRect.top + targetRect.height / 2;
        position.left = targetRect.right + 10;
        
        if (position.left > viewportWidth - 150) {
          position.left = targetRect.left - 10;
        }
        break;
        
      default:
        position.top = targetRect.bottom + 10;
        position.left = targetRect.left + targetRect.width / 2 + mobileLeftOffset;
        
        if (position.top > visibleBottom - 150) {
          position.top = targetRect.top - 10 - mobileTopOffset;
        }
    }
    
    position.top = Math.max(visibleTop + 50, Math.min(visibleBottom - 50, position.top));
    position.left = Math.max(50, Math.min(viewportWidth - 50, position.left));
    
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
