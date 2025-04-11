
import { useState, useEffect } from 'react';
import { useIsMobile } from './use-mobile';

interface KeyboardVisibilityOptions {
  threshold?: number;
  onKeyboardShow?: () => void;
  onKeyboardHide?: () => void;
}

export function useKeyboardVisibility(options: KeyboardVisibilityOptions = {}) {
  const { 
    threshold = 0.8, 
    onKeyboardShow, 
    onKeyboardHide 
  } = options;
  
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const isMobile = useIsMobile();
  
  useEffect(() => {
    if (!isMobile || !window.visualViewport) return;
    
    const detectKeyboard = () => {
      if (!window.visualViewport) return;
      
      // Calculate if keyboard is likely visible based on viewport height
      const currentIsVisible = window.visualViewport.height < window.innerHeight * threshold;
      
      // If keyboard visibility state changed, trigger appropriate callbacks
      if (currentIsVisible !== isKeyboardVisible) {
        if (currentIsVisible) {
          onKeyboardShow?.();
        } else {
          onKeyboardHide?.();
        }
      }
      
      setIsKeyboardVisible(currentIsVisible);
      
      if (currentIsVisible) {
        // Estimate keyboard height
        const estimatedKeyboardHeight = window.innerHeight - window.visualViewport.height;
        setKeyboardHeight(estimatedKeyboardHeight);
      } else {
        setKeyboardHeight(0);
      }
    };
    
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', detectKeyboard);
      window.visualViewport.addEventListener('scroll', detectKeyboard);
    }
    
    window.addEventListener('resize', detectKeyboard);
    
    // Initial check
    detectKeyboard();
    
    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', detectKeyboard);
        window.visualViewport.removeEventListener('scroll', detectKeyboard);
      }
      window.removeEventListener('resize', detectKeyboard);
    };
  }, [isMobile, threshold, isKeyboardVisible, onKeyboardShow, onKeyboardHide]);
  
  return { isKeyboardVisible, keyboardHeight };
}
