
import { useState, useEffect, useCallback } from 'react';
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
  
  const detectKeyboard = useCallback(() => {
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
      setIsKeyboardVisible(currentIsVisible);
    }
    
    // Always update keyboard height when viewport changes
    if (currentIsVisible) {
      // Estimate keyboard height
      const estimatedKeyboardHeight = window.innerHeight - window.visualViewport.height;
      setKeyboardHeight(estimatedKeyboardHeight);
    } else {
      setKeyboardHeight(0);
    }
  }, [threshold, isKeyboardVisible, onKeyboardShow, onKeyboardHide]);
  
  useEffect(() => {
    if (!isMobile || !window.visualViewport) return;
    
    // Listen for visualViewport changes
    window.visualViewport.addEventListener('resize', detectKeyboard);
    window.visualViewport.addEventListener('scroll', detectKeyboard);
    
    // Also listen for window resize as a fallback
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
  }, [isMobile, detectKeyboard]);
  
  return { isKeyboardVisible, keyboardHeight };
}
