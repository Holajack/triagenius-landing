
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
      
      // More accurate keyboard height detection for iOS Safari
      if (
        /iPad|iPhone|iPod/.test(navigator.userAgent) && 
        !(window as any).MSStream &&
        estimatedKeyboardHeight > 0
      ) {
        // Apply a more accurate factor for iOS devices
        const iosFactor = 0.95; // Better estimation for iOS
        estimatedKeyboardHeight = Math.round(estimatedKeyboardHeight * iosFactor);
      }
      
      // Add additional offset for safe area on newer devices
      const safeAreaBottom = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sat-bottom') || '0', 10);
      if (safeAreaBottom > 0) {
        estimatedKeyboardHeight += safeAreaBottom;
      }
    }
    
    // If keyboard visibility state changed, trigger appropriate callbacks
    if (currentIsVisible !== isKeyboardVisible) {
      if (currentIsVisible) {
        console.log(`Keyboard showing, height: ${estimatedKeyboardHeight}px`);
        setKeyboardHeight(estimatedKeyboardHeight);
        setIsKeyboardVisible(true);
        onKeyboardShow?.();
      } else {
        console.log('Keyboard hiding');
        setKeyboardHeight(0);
        setIsKeyboardVisible(false);
        onKeyboardHide?.();
      }
    } else if (currentIsVisible) {
      // Update keyboard height if keyboard is still visible but height changed
      if (Math.abs(estimatedKeyboardHeight - keyboardHeight) > 20) {
        console.log(`Keyboard height updated: ${estimatedKeyboardHeight}px`);
        setKeyboardHeight(estimatedKeyboardHeight);
      }
    }
  }, [threshold, isKeyboardVisible, onKeyboardShow, onKeyboardHide, keyboardHeight, lastViewportHeight]);
  
  useEffect(() => {
    if (!isMobile || typeof window === 'undefined' || !window.visualViewport) return;
    
    // Set initial viewport height reference
    setLastViewportHeight(window.visualViewport.height);
    
    // Enhanced debounced handler with immediate execution for smoother transitions
    let timeout: NodeJS.Timeout | null = null;
    let immediateTimeout: NodeJS.Timeout | null = null;
    
    const debouncedDetectKeyboard = () => {
      // Clear any existing timeouts
      if (timeout) clearTimeout(timeout);
      if (immediateTimeout) clearTimeout(immediateTimeout);
      
      // Run an immediate detection for responsive feel
      immediateTimeout = setTimeout(() => {
        detectKeyboard();
      }, 10);
      
      // Then do a stable detection after debounce time
      timeout = setTimeout(() => {
        detectKeyboard();
      }, debounceTime);
    };
    
    // Listen for visualViewport changes - primary detection method
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
        setTimeout(detectKeyboard, 150);
      }
    };
    
    document.addEventListener('focusin', handleFocus);
    
    // Setup safe area variables
    if ('env' in CSS && CSS.supports('top', 'env(safe-area-inset-bottom)')) {
      document.documentElement.style.setProperty(
        '--sat-bottom',
        'env(safe-area-inset-bottom)'
      );
    }
    
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
      if (immediateTimeout) clearTimeout(immediateTimeout);
    };
  }, [isMobile, detectKeyboard, debounceTime]);
  
  return { isKeyboardVisible, keyboardHeight };
}
