
import { useEffect, useState, useRef } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useWalkthrough } from '@/contexts/WalkthroughContext';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';

type HighlightOverlayProps = {
  targetRect: DOMRect | null;
};

// This creates a spotlight effect around the target element
const HighlightOverlay = ({ targetRect }: HighlightOverlayProps) => {
  if (!targetRect) return null;

  return createPortal(
    <div 
      className="fixed inset-0 z-40 bg-black/50 pointer-events-none"
      style={{
        clipPath: targetRect 
          ? `path('M 0,0 L 0,100% L 100%,100% L 100%,0 Z M ${targetRect.left},${targetRect.top} L ${targetRect.left},${targetRect.bottom} L ${targetRect.right},${targetRect.bottom} L ${targetRect.right},${targetRect.top} Z')`
          : undefined
      }}
    >
      <div
        className="absolute border-2 border-triage-purple rounded-md"
        style={{
          left: targetRect.left - 4,
          top: targetRect.top - 4,
          width: targetRect.width + 8,
          height: targetRect.height + 8,
          boxShadow: '0 0 0 4px rgba(139, 92, 246, 0.3)'
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

  const currentStep = state.steps[state.currentStepIndex];
  
  useEffect(() => {
    if (!state.isActive || !currentStep?.targetSelector) return;
    
    const element = document.querySelector(currentStep.targetSelector) as HTMLElement;
    if (element) {
      setTargetElement(element);
      setTargetRect(element.getBoundingClientRect());
      
      // Add highlight effect to the element
      element.classList.add('ring-2', 'ring-triage-purple', 'ring-offset-2', 'transition-all');
      
      // Scroll element into view if needed
      const elementRect = element.getBoundingClientRect();
      const isInViewport = 
        elementRect.top >= 0 &&
        elementRect.left >= 0 &&
        elementRect.bottom <= window.innerHeight &&
        elementRect.right <= window.innerWidth;
        
      if (!isInViewport) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      
      // Open popover after a short delay
      setTimeout(() => {
        setIsOpen(true);
      }, 400);
    }
    
    // Update rect on window resize
    const handleResize = () => {
      if (element) {
        setTargetRect(element.getBoundingClientRect());
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      if (element) {
        element.classList.remove('ring-2', 'ring-triage-purple', 'ring-offset-2');
      }
    };
  }, [state.isActive, state.currentStepIndex, currentStep]);
  
  const handleNext = () => {
    dispatch({ type: 'NEXT_STEP' });
    setIsOpen(false);
  };
  
  const handlePrevious = () => {
    dispatch({ type: 'PREVIOUS_STEP' });
    setIsOpen(false);
  };
  
  const handleSkip = () => {
    dispatch({ type: 'COMPLETE_WALKTHROUGH' });
    setIsOpen(false);
  };
  
  const isFirstStep = state.currentStepIndex === 0;
  const isLastStep = state.currentStepIndex === state.steps.length - 1;
  
  if (!state.isActive || !currentStep) return null;

  // Determine popover position
  const getPopoverPosition = () => {
    if (!targetRect) return { top: 0, left: 0 };
    
    const padding = 10;
    
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
          className="w-72 p-0 border-triage-purple shadow-lg"
          sideOffset={5}
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
                      className={`h-1.5 w-3 rounded-full transition-colors ${
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
                      className="h-8 px-2 text-xs"
                    >
                      <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Back
                    </Button>
                  )}
                  
                  {isLastStep ? (
                    <Button 
                      size="sm" 
                      onClick={handleNext}
                      className="h-8 px-3 text-xs bg-triage-purple hover:bg-triage-purple/90"
                    >
                      Finish
                    </Button>
                  ) : (
                    <Button 
                      size="sm" 
                      onClick={handleNext}
                      className="h-8 px-3 text-xs bg-triage-purple hover:bg-triage-purple/90"
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
