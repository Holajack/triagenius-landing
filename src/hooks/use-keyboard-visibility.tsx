
import { useState, useEffect, useCallback } from 'react';
import { useIsMobile } from './use-mobile';

interface KeyboardVisibilityOptions {
  threshold?: number;
  onKeyboardShow?: () => void;
  onKeyboardHide?: () => void;
  debounceTime?: number;
}

export function useKeyboardVisibility(options: KeyboardVisibilityOptions = {}) {
  const { 
    threshold = 0.8, 
    onKeyboardShow, 
    onKeyboardHide,
    debounceTime = 100
  } = options;
  
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [lastViewportHeight, setLastViewportHeight] = useState<number>(0);
  const isMobile = useIsMobile();
  
  const detectKeyboard = useCallback(() => {
    if (!window || !window.visualViewport) return;
    
    const viewportHeight = window.visualViewport.height;
    const windowHeight = window.innerHeight;
    
    // Track significant changes in viewport height
    if (Math.abs(viewportHeight - lastViewportHeight) > 50) {
      setLastViewportHeight(viewportHeight);
    }
    
    // Calculate if keyboard is likely visible based on viewport height ratio
    const viewportRatio = viewportHeight / windowHeight;
    const currentIsVisible = viewportRatio < threshold;
    
    // If keyboard visibility state changed, trigger appropriate callbacks
    if (currentIsVisible !== isKeyboardVisible) {
      if (currentIsVisible) {
        // Estimate keyboard height with more accuracy
        const estimatedKeyboardHeight = Math.round(windowHeight - viewportHeight);
        setKeyboardHeight(estimatedKeyboardHeight);
        setIsKeyboardVisible(true);
        onKeyboardShow?.();
      } else {
        setKeyboardHeight(0);
        setIsKeyboardVisible(false);
        onKeyboardHide?.();
      }
    } else if (currentIsVisible) {
      // Update keyboard height if keyboard is still visible but height changed
      const estimatedKeyboardHeight = Math.round(windowHeight - viewportHeight);
      if (Math.abs(estimatedKeyboardHeight - keyboardHeight) > 20) {
        setKeyboardHeight(estimatedKeyboardHeight);
      }
    }
  }, [threshold, isKeyboardVisible, onKeyboardShow, onKeyboardHide, keyboardHeight, lastViewportHeight]);
  
  useEffect(() => {
    if (!isMobile || typeof window === 'undefined' || !window.visualViewport) return;
    
    // Set initial viewport height reference
    setLastViewportHeight(window.visualViewport.height);
    
    // Debounced handler to prevent excessive updates
    let timeout: NodeJS.Timeout | null = null;
    const debouncedDetectKeyboard = () => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(detectKeyboard, debounceTime);
    };
    
    // Listen for visualViewport changes
    window.visualViewport.addEventListener('resize', debouncedDetectKeyboard);
    
    // Also listen for orientation changes and window resize as fallbacks
    window.addEventListener('resize', debouncedDetectKeyboard);
    window.addEventListener('orientationchange', debouncedDetectKeyboard);
    
    // Initial check
    detectKeyboard();
    
    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', debouncedDetectKeyboard);
      }
      window.removeEventListener('resize', debouncedDetectKeyboard);
      window.removeEventListener('orientationchange', debouncedDetectKeyboard);
      if (timeout) clearTimeout(timeout);
    };
  }, [isMobile, detectKeyboard, debounceTime]);
  
  return { isKeyboardVisible, keyboardHeight };
}
