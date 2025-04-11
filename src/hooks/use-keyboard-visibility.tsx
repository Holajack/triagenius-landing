
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
    
    // Calculate keyboard height more accurately
    let estimatedKeyboardHeight = 0;
    if (currentIsVisible) {
      // Get the difference between window height and visual viewport height
      estimatedKeyboardHeight = Math.round(windowHeight - viewportHeight);
      
      // Adjust for iOS Safari additional padding (if needed)
      if (
        /iPad|iPhone|iPod/.test(navigator.userAgent) && 
        !(window as any).MSStream &&
        estimatedKeyboardHeight > 0
      ) {
        // iOS Safari might need an adjustment for the bottom toolbar
        const safariFactor = 0.85; // Adjust this based on testing
        estimatedKeyboardHeight = Math.round(estimatedKeyboardHeight * safariFactor);
      }
    }
    
    // If keyboard visibility state changed, trigger appropriate callbacks
    if (currentIsVisible !== isKeyboardVisible) {
      if (currentIsVisible) {
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
      if (Math.abs(estimatedKeyboardHeight - keyboardHeight) > 20) {
        setKeyboardHeight(estimatedKeyboardHeight);
      }
    }
  }, [threshold, isKeyboardVisible, onKeyboardShow, onKeyboardHide, keyboardHeight, lastViewportHeight]);
  
  useEffect(() => {
    if (!isMobile || typeof window === 'undefined' || !window.visualViewport) return;
    
    // Set initial viewport height reference
    setLastViewportHeight(window.visualViewport.height);
    
    // Improved debounced handler to prevent excessive updates but ensure smooth transitions
    let timeout: NodeJS.Timeout | null = null;
    const debouncedDetectKeyboard = () => {
      if (timeout) clearTimeout(timeout);
      // First quickly update with current values to avoid lag
      detectKeyboard();
      // Then properly update after debounce time for stabilization
      timeout = setTimeout(detectKeyboard, debounceTime);
    };
    
    // Listen for visualViewport changes
    window.visualViewport.addEventListener('resize', debouncedDetectKeyboard);
    
    // Also listen for orientation changes and window resize as fallbacks
    window.addEventListener('resize', debouncedDetectKeyboard);
    window.addEventListener('orientationchange', debouncedDetectKeyboard);
    
    // Listen for focus events on input elements, which often trigger keyboard
    const handleFocus = (e: FocusEvent) => {
      if (
        e.target instanceof HTMLInputElement || 
        e.target instanceof HTMLTextAreaElement
      ) {
        // Wait a moment for the keyboard to appear
        setTimeout(detectKeyboard, 200);
      }
    };
    
    document.addEventListener('focusin', handleFocus);
    
    // Initial check
    detectKeyboard();
    
    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', debouncedDetectKeyboard);
      }
      window.removeEventListener('resize', debouncedDetectKeyboard);
      window.removeEventListener('orientationchange', debouncedDetectKeyboard);
      document.removeEventListener('focusin', handleFocus);
      if (timeout) clearTimeout(timeout);
    };
  }, [isMobile, detectKeyboard, debounceTime]);
  
  return { isKeyboardVisible, keyboardHeight };
}
